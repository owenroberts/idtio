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

const Game = {};
Game.currentScene = 'intro';
io.sockets.emit('state', Game.currentScene);
const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false }
}
const players = {};
let gameInterval;

/* all game updates  go here */
function gameUpdate() {
	for (const id in players) {
		const player = players[id];
		if (player.movement.up)
			player.y -= player.speed;
		if (player.movement.down)
			player.y += player.speed;
		if (player.movement.right)
			player.x += player.speed;
		if (player.movement.left)
			player.x -= player.speed;
	}
	io.sockets.emit('players', players);
}


io.on('connection', function(socket) {
	/* new connection, create a player */
	socket.on('new', function(playerPosition) {
		console.log('new', socket.id);
		players[socket.id] = {}; // constructor 
		players[socket.id].x = playerPosition.x;
		players[socket.id].y = playerPosition.y;
		players[socket.id].movement = {
			right: false,
			up: false,
			left: false,
			down: false
		};
		players[socket.id].speed = 5;
	});

	/* player should select character */
	socket.on('character selection', function(character) {
		/* assign if character not being used */
		if (!characters[character].isInUse) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			socket.emit('character selection', character);
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
			gameInterval = setInterval(gameUpdate, 1000 / 60);
		} else {
			socket.emit('msg', 'Please select a character');
		}
	});
	
	/*  regular update with player input */
	socket.on('update', function(data) {
		players[socket.id].movement = data.movement;
	});

	/* player leaves */
	socket.on('disconnect', function() {
		console.log('remove', socket.id);
    	clearInterval(gameInterval);
    	if (players[socket.id]) {
    		if (players[socket.id].character) {
    			characters[players[socket.id].character].isInUse = false;
    			delete players[socket.id];
    		}
    	}
  	});
});