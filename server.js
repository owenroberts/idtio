const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const mapData = require('./public/data/map-data.json');
const Interactive = require('./Interactive.js'); 
const Pickup = require('./Pickup.js');
const Player = require('./Player.js');

app.set('port', 5000);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/map', function(request, response){
	response.sendFile(path.join(__dirname, 'public/map/index.html'));
});

server.listen(5000, function() {
	console.log('Starting server on port 5000');
});

const DEBUG = true;
let gameIsPlaying = false;
let gameInterval;
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false },
	pig: { isInUse: false }
};
const players = {};
const interactives = {};

for (const i in mapData.interactives) {
	interactives[mapData.interactives[i].label] = new Interactive(mapData.interactives[i]);
}
for (const i in mapData.pickups) {
	interactives[mapData.pickups[i].label] = new Pickup(mapData.pickups[i]);
}

function gameUpdate() {
	var data = {
		players: {},
		interactives: {}
	}
	for (const id in players) {
		const player = players[id];
		if (player.joinedGame) {
			data.players[id] = player.getUpdate();
			if (player.storyInput) {
				io.sockets.emit('story input', {
					character: player.character, 
					type: player.storyInput
				});
			}

			for (const o in players) {
				const other = players[o];
				if (other.id != id && other.joinedGame) {
					other.checkInRange(player, (msg) => {
						const data = {
							players: [
								{ id: id, character: player.character },
								{ id: other.id, character: other.character }
							]
						};
						if (msg == 'entered' || msg == 'exited') {
							if (!player.storyInput && !other.storyInput) {
								data.state = msg == 'entered' ? true : false
								// player.isInteracting = 'entered' ? true : false;
								// other.isInteracting = 'entered' ? true : false;
								player.storyInput = false;
								other.storyInput = false;
								io.sockets.emit('character interface',  data);
							}
						} else if (msg == 'talking') {
							if (player.storyInput && other.storyInput) {
								data.state = {};
								data.state[id] = player.character + '-' + other.character + '-' + player.	storyInput + '-' + other.storyInput;
								data.state[other.id] = other.character + '-' + player.character + '-' + other.storyInput + '-' + player.storyInput;
								/* is this crazy?? */
								io.sockets.emit('character talk', data);
								player.resources[player.storyInput].shift();
								other.resources[other.storyInput].shift();
								io.sockets.emit('update resources', player);
								io.sockets.emit('update resources', other);
								player.storyInput = false;
								other.storyInput = false;
							}
						}
					});
				}
			}

			for (const i in interactives) {
				const interactive = interactives[i];
				if (!interactive.picked) {
					interactive.checkInRange(player, (msg) => {
						if (msg == 'exited') {
							player.isInteracting = false;
							io.sockets.connected[id].emit('display interact message', {
								label: interactive.label, 
								type: interactive.type, 
								state: false 
							});
						} else if (msg == 'entered') {
							io.sockets.connected[id].emit('display interact message', { 
								label: interactive.label, 
								type: interactive.type, 
								state: true 
							});
						}  else if (msg == 'picked up') {
							io.sockets.emit('play interact animation', interactive.label);
							io.sockets.emit('play character animation', player.character, interactive.type);
							io.sockets.emit('update resources', player);
						} else if (msg == 'interacted') {
							io.sockets.emit('play interact animation', interactive.label);
						}
					});
				}
			}
		}
	}
	io.sockets.emit('update', data);
}

function initData() {
	var data = {
		players: {},
		interactives: {}
	}
	for (const id in players) {
		if (players[id].character) {
			data.players[id] = players[id].getUpdate();
			// data.players[id].character = players[id].character;
			data.players[id].resources = players[id].resources;
		}
	}
	for (const label in interactives) {
		if (interactives[label].isPickup)
			data.interactives[label] = interactives[label].getUpdate();
	}
	return data;
}

io.on('connection', function(socket) {
	console.log('new', socket.id);
	players[socket.id] = new Player(socket);
	socket.on('splash loaded', () => {
		socket.emit('init', initData());
	});

	/* select a character (need access to characters obj) */
	socket.on('character selection', (character) => {
		if (!characters[character].isInUse) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			io.sockets.emit('character chosen', character);
		} else if (players[socket.id].character == character) {
			socket.emit('msg', 'you have selected that character');
		} else {
			socket.emit('msg', 'character not available');
		}
	});

	/* joins game (needs other players) */
	socket.on('join', () => {
		const joined = players[socket.id].join(socket);
		if (joined) {
			socket.emit('init', initData()); /* for flowers */
			io.sockets.emit('add character', players[socket.id]);
			/* if this is the first player to join start gameInterval */
			if (!gameIsPlaying) {
				gameIsPlaying = true;
				gameInterval = setInterval(gameUpdate, 1000 / 60);
			}
		}
	});

	/* player leaves */
	socket.on('disconnect', function() {
		// console.log('remove', socket.id);
    	if (players[socket.id]) {
    		const p = players[socket.id];
    		if (p.character) {
    			characters[p.character].isInUse = false;
    			io.sockets.emit('remove character', p.character);
    		}

    		/* restore playres resources */
    		for (var r in p.resources) {
    			const resourceList = p.resources[r];
    			for (let i = 0; i < resourceList.length; i++) {
    				interactives[resourceList[i]].picked = false;
    			}
    		}

    		delete players[socket.id];
    	}
    	/* if all players are gone stop gameInterval */
    	if (Object.keys(players).length == 0) {
	    	clearInterval(gameInterval);
	    	gameIsPlaying = false;
    	}
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