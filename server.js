const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const mapData = require('./public/map-data.json');
const Entities = require('./Entity.js'); // don't love this var name
const Player = require('./Player.js');

app.set('port', 5000);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {
	console.log('Starting server on port 5000');
});

const DEBUG = true;
let gameInterval;
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false }
};
const players = {};
const interactives = {};
for (const i in mapData.interactives) {
	interactives[mapData.interactives[i].label] = new Entities.Entity(mapData.interactives[i]);
}
for (const i in mapData.pickups) {
	interactives[mapData.pickups[i].label] = new Entities.Pickup(mapData.pickups[i]);
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


			for (const i in interactives) {
				const interactive = interactives[i];
				if (!interactive.picked) {
					interactive.get(player, (msg) => {
						const state = msg == 'exit' ? false : true;
						/* is it possible to do this in entity class? 
							no access to io.sockets 
							if player.socket works */
						interactive.displayInteractMessage(state, io.sockets.connected[id]);
					});
				}
			}
		}
	}
	io.sockets.emit('update', {
		players: players
	});
}

io.on('connection', function(socket) {
	console.log('new', socket.id);
	players[socket.id] = new Player(socket);

	/* select a character (need access to characters obj) */
	socket.on('character selection', (character) => {
		/* assign if character not being used */
		if (!characters[character].isInUse && !this.character) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			socket.emit('character chosen', character);
		} else if (players[socket.id].character == character) {
			socket.emit('msg', 'you have selected that character');
		} else {
			/* else need to message them */
			socket.emit('msg', 'character not available');
		}
	});

	/* joins game (needs other players) */
	socket.on('join', () => {
		const joined = players[socket.id].join(socket);
		if (joined) {
			io.sockets.emit('add character', players[socket.id]);
			/* if this is the first player to join start gameInterval */
			if (Object.keys(players).length == 1) {
				gameInterval = setInterval(gameUpdate, 1000 / 60);
			} else { /* if not add the other players */
				for (const id in players) {
					if (id != socket.id && players[id].joinedGame)
						socket.emit('add character', players[id]);
				}
			}
		}
	});

	/* here bc needs access to players and interactives */
	socket.on('trigger', (label) => {
		console.log(label);
		const i = interactives[label];
		if (i.isPickup) {
			if (!i.picked) {
				i.picked = true;
				io.sockets.emit('play interact animation', label);
				players[socket.id].isInteracting = true;
				players[socket.id].resources[interactives[label].type].push(label);
				socket.emit('play character animation', players[socket.id].character, i.type);
			}
		} else {
			io.sockets.emit('play interact animation', label);
		}
	});

	/* player leaves */
	socket.on('disconnect', function() {
		console.log('remove', socket.id);
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
    	if (Object.keys(players).length == 0)
	    	clearInterval(gameInterval);
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