const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(request, response){
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {
	console.log('Starting server on port 5000');
});

const DEBUG = true;
const Game = {};
Game.currentScene = 'intro';
io.sockets.emit('state', Game.currentScene);
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false }
};
const players = {};
function Player(x, y) {
	this.x = x;
	this.y = y;
	this.movement = {
		right: false,
		up: false,
		left: false,
		down: false
	};
	this.speed = 5;
	this.update = function() {
		if (this.movement.up)
			this.y -= this.speed;
		if (this.movement.down)
			this.y += this.speed;
		if (this.movement.right)
			this.x += this.speed;
		if (this.movement.left)
			this.x -= this.speed;
	};
}
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
	/* new connection, create a player */
	socket.on('new', function(pos) {
		console.log('new', socket.id);
		players[socket.id] = new Player(pos.x, pos.y);
	});

	/* player should select character */
	socket.on('character selection', function(character) {
		/* assign if character not being used */
		if (!characters[character].isInUse) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			socket.emit('character selection', character);
		} else if (players[socket.id].character == character) {
			socket.emit('msg', 'you have selected that character');
		} else {
			/* else need to message them */
			socket.emit('msg', 'character not available');
		}
	});

	/* when player clicks join game */
	socket.on('join', function() {
		if (players[socket.id].character) {
			Game.currentScene = 'game';
			socket.emit('scene', 'game');
			/* if this is the first player to join start gameInterval */
			if (Object.keys(players).length == 1)
				gameInterval = setInterval(gameUpdate, 1000 / 60);
		} else {
			socket.emit('msg', 'Please select a character');
		}
	});
	
	/*  regular update with player input from client */
	socket.on('update', function(data) {
		players[socket.id].movement = data.movement;
	});

	/* player leaves */
	socket.on('disconnect', function() {
		console.log('remove', socket.id);
    	if (players[socket.id]) {
    		if (players[socket.id].character) {
    			characters[players[socket.id].character].isInUse = false;
    			delete players[socket.id];
    		}
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