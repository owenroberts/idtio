const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const mapData = require('./public/data/map-data.json');
const Interactive = require('./Interactive.js'); 
const Pickup = require('./Pickup.js');
const Player = require('./Player.js');

const port = process.env.PORT || 5001;
app.set('port', port);
app.use('/public', express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.gif')))

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/map', function(request, response){
	response.sendFile(path.join(__dirname, 'public/map/index.html'));
});

server.listen(port, function() {
	console.log('Starting server on port ' + port);
});

// console.clear();
const DEBUG = true;
let gameIsPlaying = false;
let gameInterval;
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false },
	pig: { isInUse: false },
	birds: { isInUse: false },
	fruit: { isInUse: false }
};
const players = {};
const interactives = {};

for (const label in mapData.interactives) {
	interactives[label] = new Interactive(mapData.interactives[label]);
}

for (const type in mapData.pickups) {
	const items = mapData.pickups[type].items;
	for (const label in items) {
		const pickup = items[label];
		pickup.type = type;
		pickup.label = label;
		pickup.distance = mapData.pickups[type].distance;
		interactives[label] = new Pickup(pickup);
	}
}

function randomType() {
	const types = ['flower', 'heart', 'skull'];
	return types[Math.floor( Math.random() * types.length )];
}

function gameUpdate() {
	var data = { players: {}, interactives: {} };
	for (const id in players) {
		const player = players[id];
		if (player.joinedGame) {
			data.players[id] = player.getUpdate();

			if (player.waving) {
				io.sockets.emit('play character animation', player.character, 'wave');
				data.players[id].waving = true;
				player.waving = false;
			}

			for (const o in players) {
				const other = players[o];
				if (other.id != id && other.joinedGame) {
					other.checkInRange(player, (isInRange, wasInRange) => {
						if (isInRange && !wasInRange) {   /* entered */
							if (!other.isInteracting && !player.isInteracting) {
								io.sockets.emit('start story', player.character, other.character); /* any way to add this to update ? */
								other.isInteracting  = player.isInteracting = true;
							}
						} else {
							if (wasInRange) { /* exited */
								/* end story? */
							}
						}
					});
				}
			}

			for (const label in interactives) {
				const interactive = interactives[label];
				if (!interactive.picked) { 
					interactive.checkInRange(player, (isInRange, wasInRange) => {
						if (isInRange && !wasInRange) { // entered
							if (interactive.isPickup && !interactive.picked) {
								io.sockets.emit('play character animation', player.character, interactive.type); // general update ? 
								io.sockets.emit('play interact animation', label); // general update ?? 
								player.resources[interactive.type].push(label);
								io.sockets.emit('update resources', player); // can this be  part of general update? 
								interactive.picked = true;
							} else {
								io.sockets.emit('play interact animation', label);
							}
						}
					});
				}
			}
		}
	}
	io.sockets.emit('update', data);
}

function getCharacterData() {
	var data = { players: {} };
	for (const id in players) {
		if (players[id].character) {
			data.players[id] = players[id].getUpdate();
			data.players[id].resources = players[id].resources;
		}
	}
	return data;
}

function getItemData() {
	var data = { players: {}, interactives: {} };
	for (const label in interactives) {
		if (interactives[label].isPickup)
			data.interactives[label] = interactives[label].getUpdate();
	}
	return data;
}

io.on('connection', function(socket) {
	console.log('new', socket.id);
	players[socket.id] = new Player(socket);

	socket.on('set bounds', (width, height) => {
		players[socket.id].setBounds(width, height);
	});

	socket.on('splash loaded', () => {
		socket.emit('init splash', getCharacterData());
	});

	/* select a character (need access to characters obj) 
		adding "join" */
	socket.on('character join', (character) => {
		if (!characters[character].isInUse) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			io.sockets.emit('character selected', character, true);
			players[socket.id].join(character, socket);
			io.sockets.emit('add character', players[socket.id]);
			socket.emit('join game', getItemData()); 

			/* if this is the first player to join start gameInterval */
			if (!gameIsPlaying) {
				gameIsPlaying = true;
				gameInterval = setInterval(gameUpdate, 1000 / 60);
			}
		} else {
			socket.emit('msg', 'character not available');
		}
	});

	socket.on('change scene', (scene) => {
		socket.emit('change scene', scene);
	});

	/* player leaves */
	function exitGame(socketLive) {
		if (players[socket.id]) {
			const p = players[socket.id];
			if (p.character) {
				characters[p.character].isInUse = false;
				io.sockets.emit('remove character', p.character);
			}

			/* restore players resources */
			const resources = p.returnResources();
			for (let i = 0; i < resources.length; i++) {
				const item = resources[i];
				interactives[item].picked = false;
				interactives[item].removePlayer(p.id);
				io.sockets.emit('return resource', interactives[item].label);
			}

			/* end in progress dialogs */
			for (let i = 0; i < p.playersInRange.length; i++) {
				const pid = p.playersInRange[i]; /* player id */
				players[pid].endDialog();
				players[pid].removePlayer(p.id);
				io.sockets.emit('end story', players[pid].character);
			}

			if (!socketLive)
				delete players[socket.id];
			else {
				players[socket.id].reset();
			}
		}
		/* if all players are gone stop gameInterval */
		if (Object.keys(players).length == 0) {
			clearInterval(gameInterval);
			gameIsPlaying = false;
		}
		socket.emit('change scene', 'splash');
	}

	socket.on('exit game', () => {
		exitGame(true);
	});
	socket.on('disconnect', () => {
		exitGame(false);
	});

	/* chat */
	socket.on('send-chat', function(msg) {
		io.sockets.emit('get-chat', players[socket.id].character + ": " + msg);
	});

	/* debug */
	socket.on('send-eval', function(msg) {
		if (!DEBUG)
			return;
		const res = eval(msg);
		socket.emit('get-eval', res);
	});
});