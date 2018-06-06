const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

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
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false }
};
const players = {};
let gameInterval;

/* all game updates  go here */
function gameUpdate() {
	for (const id in players) {
		const player = players[id];
		player.update();
	}
	io.sockets.emit('players', players);
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


	/* player leaves */
	socket.on('disconnect', function() {
		console.log('remove', socket.id);
    	if (players[socket.id]) {
    		if (players[socket.id].character) {
    			characters[players[socket.id].character].isInUse = false;
    			io.sockets.emit('remove character', players[socket.id].character);
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