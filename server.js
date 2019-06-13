const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const mapData = require('./public/data/map.json');
const characterData = require('./public/data/character.json');
const script = require('./public/data/script.json');
const Entity = require('./classes/Entity.js'); 
const Interactive = require('./classes/Interactive.js'); 
const Pickup = require('./classes/Pickup.js');
const Player = require('./classes/Player.js');

const port = process.env.PORT || 5001;
app.set('port', port);
app.use('/public', express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.gif')))

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/test', function(request, response){
	response.sendFile(path.join(__dirname, 'public/test.html'));
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
const playerTimeout = 60 * 60 * 10;
const inGame = [];
const players = {};
const interactives = {};
const items = {};

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

for (const label in mapData.scenery) {
	const set = mapData.scenery[label];
	items[label] = [];
	for (let i = 0; i < set.length; i++) {
		if (set[i].msg) {
			set[i].distance = 256;
			items[label].push(new Entity(set[i]));
		}
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
								const [one, two] = Math.round(Math.random()) ? [player.character, other.character] : [other.character, player.character];
								const story = [];
								for (let i = 0; i < 8; i++) {
									const [c, o] = i % 2 ? [two, one] : [one, two];
									const s = script[c][o][script.order[i]];
									story.push({
										character: c,
										dialog: s[Math.floor(Math.random() * s.length)]
									});
								}
								io.sockets.emit('start story', story); /* any way to add this to update ? */
								other.isInteracting  = player.isInteracting = true;
							}
						}
					});
				}
			}

			for (const label in interactives) {
				const interactive = interactives[label];
				if (!interactive.picked && !interactive.isInteracting) { 
					interactive.checkInRange(player, (isInRange, wasInRange) => {
						if (isInRange && !wasInRange) { // entered
							if (interactive.isPickup && !interactive.picked) {
								io.sockets.emit('play character animation', player.character, interactive.type); // general update ? 
								io.sockets.emit('play interact animation', label); // general update ?? 
								io.sockets.emit('display item message', label);
								player.resources[interactive.type].push(label);
								io.sockets.emit('update resources', player); // can this be  part of general update? 
								interactive.picked = true;
							} else if (!interactive.resource) {
								io.sockets.emit('play interact animation', label);
							} else { /* currently just voids */
								if (player.resources[interactive.resource].length > 0) {
									io.sockets.emit('play interact animation', label);
									io.sockets.emit('play character animation', player.character, `drop-${interactive.resource}`); // general update ? 
									player.usedResources[interactive.resource].push(player.resources[interactive.resource].shift()); /* move to used resources */
									// set void/interactive to "interacting"
									interactive.isInteracting = true;
								} else {
									io.sockets.emit('display item message', label);
								}
							}
						}
					});
				}
			}

			for (const label in items) {
				const set = items[label];
				for (let i = 0; i < set.length; i++) {
					const item = set[i];
					if (item.msg) {
						item.checkInRange(player, (isInRange, wasInRange) => {
							if (isInRange && !wasInRange) io.sockets.emit('display item message', label, i);
							if (!isInRange && wasInRange) io.sockets.emit('hide item message', label, i);
						});
					}
				}
			}

			/* check timeout */
			player.timeoutCount++;
			if (player.timeoutCount > playerTimeout)
				exit(player.id, true);
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

function exit(id, socketLive) {
	console.log('exit', id);
	if (players[id]) {
		const p = players[id];
		if (p.character) {
			inGame.splice(inGame.indexOf(p.character), 1);
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

		if (!socketLive) delete players[id];
		else  players[id].reset();
	}
	/* if all players are gone stop gameInterval */
	if (Object.keys(players).length == 0) {
		clearInterval(gameInterval);
		gameIsPlaying = false;
	}
	io.to(id).emit('change scene', 'splash');
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
	socket.on('character join', character => {
		if (inGame.indexOf(character) == -1) {
			players[socket.id].character = character;
			players[socket.id].x = characterData[character].x;
			players[socket.id].y = characterData[character].y;
			inGame.push(character);
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

	socket.on('change scene', scene => {
		socket.emit('change scene', scene);
	});

	socket.on('interact animation end', label => {
		interactives[label].isInteracting = false;
	});

	/* player leaves */
	socket.on('exit game', () => { exit(socket.id, true); });
	socket.on('disconnect', () => { exit(socket.id, false); });

	/* debug */
	socket.on('send-eval', function(msg) {
		if (!DEBUG) return;
		const res = eval(msg);
		socket.emit('get-eval', res);
	});
});