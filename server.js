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

const port = process.env.PORT || 5001;
app.set('port', port);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/map', function(request, response){
	response.sendFile(path.join(__dirname, 'public/map/index.html'));
});

server.listen(port, function() {
	console.log('Starting server on port ' + port);
});

const DEBUG = true;
let gameIsPlaying = false;
let gameInterval;
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false },
	pig: { isInUse: false },
	birds: { isInUse: false }
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

			/* if story type is input show it on client, and flag that it is being shown */
			if (player.act.inputStoryType && !player.act.storyTypeSent) {
				io.sockets.emit('story input', {
					character: player.character, 
					type: player.act.inputStoryType
				});
				player.act.storyTypeSent = true;
			}

			for (const o in players) {
				const other = players[o];
				if (other.id != id && other.joinedGame) {
					if (!player.act.storyStarted && !other.act.storyStarted) {
						other.checkInRange(player, (isInRange, wasInRange) => {
							const players =[
								{ id: id, character: player.character },
								{ id: other.id, character: other.character }
							];
							
							if (isInRange) { 
								if (!wasInRange) { /* entered */
									player.act.inPlayerRange = true;
									io.sockets.emit('character interface', player.id, player.character, true);
								}
								if (player.act.inputStoryType && other.act.inputStoryType) {
									io.sockets.emit('start story', [
										{ character: player.character, type: player.act.inputStoryType },
										{ character: other.character, type: other.act.inputStoryType }
									]); 
									player.usedResources[player.act.inputStoryType].push( player.resources[player.act.inputStoryType].shift() );
									other.usedResources[other.act.inputStoryType].push( other.resources[other.act.inputStoryType].shift() );
									io.sockets.emit('update resources', player);
									io.sockets.emit('update resources', other);
									player.act.storyStarted = true;
									other.act.storyStarted = true;
								}
							} else {
								if (wasInRange) { /* exited */
									if (player.act.inPlayerRange) {
										player.act.inPlayerRange = false;
										io.sockets.emit('character interface',  player.id, player.character, false);
									}
									if (player.act.inputStoryType) {
										io.sockets.emit('story input', {
											character: player.character, 
											type: false
										});
										player.act.inputStoryType = false;
										player.act.storyTypeSent = false;
									}
								}
							}
						});
					}
				}
			}

			for (const i in interactives) {
				const interactive = interactives[i];
				if (!interactive.picked) { 
					interactive.checkInRange(player, (isInRange, wasInRange) => {

						/* first check if another player has entered the scene */
						if (player.act.inPlayerRange) {
							if (player.act.inItemRange == interactive.label) {
								io.sockets.connected[id].emit('display interact message', {
									label: interactive.label, 
									type: interactive.type, 
									state: false 
								});
								player.act.inItemRange = false;
							}
						} else {
							if (isInRange) {
								if (!player.act.inItemRange) { /* entered */
									player.act.inItemRange = interactive.label;
									io.sockets.connected[id].emit('display interact message', { 
										label: interactive.label, 
										type: interactive.type, 
										state: true 
									});
								}
								if (player.act.withItem) {
									player.act.withItem = false;
									player.act.inItemRange = false;
									if (interactive.isPickup && !interactive.picked) {
										io.sockets.emit('play character animation', player.character, interactive.type);
										io.sockets.emit('play interact animation', interactive.label);
										player.resources[interactive.type].push( interactive.label );
										io.sockets.emit('update resources', player);
										interactive.picked = true;
									} else {
										io.sockets.emit('play interact animation', interactive.label);
									}
								}
							} else {
								if (wasInRange) { /* exited */
									io.sockets.connected[id].emit('display interact message', {
										label: interactive.label, 
										type: interactive.type, 
										state: false 
									});
									player.act.inItemRange = false;
								}
							}
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

	socket.on('set bounds', (width, height) => {
		players[socket.id].setBounds(width, height);
	});

	socket.on('splash loaded', () => {
		socket.emit('init', initData());
	});

	/* select a character (need access to characters obj) */
	socket.on('character selection', (character) => {
		if (!characters[character].isInUse) {
			if (players[socket.id].character) {
				characters[players[socket.id].character].isInUse = false;
				io.sockets.emit('character unchosen', players[socket.id].character);
			}
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