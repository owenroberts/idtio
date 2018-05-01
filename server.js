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
	scratch: {
		isInUse: false
	}
}
const players = {};
let gameInterval;

function gameUpdate() {
	for (const id in players) {
		const player = players[id];
		if (player.movement.up)
			player.y -= 5;
		if (player.movement.down)
			player.y += 5;
		if (player.movement.right)
			player.x += 5;
		if (player.movement.left)
			player.x -= 5;
	}
	io.sockets.emit('players', players);
}

io.on('connection', function(socket){
	socket.on('new', function(playerPosition) {
		console.log('new', socket.id);
		players[socket.id] = {};
		players[socket.id].character = 'none';
		players[socket.id].x = playerPosition.x;
		players[socket.id].y = playerPosition.y;
		players[socket.id].movement = {
			right: false,
			up: false,
			left: false,
			down: false
		}
	});

	socket.on('scene', function(scene) {
		if (scene == 'game') {
			console.log(scene);
			if (players[socket.id].character != 'none') {
				Game.currentScene = scene;
				socket.emit('scene', scene);
				gameInterval = setInterval(gameUpdate, 1000 / 60);
			} else {
				socket.emit('msg', 'Please select a character');
			}
		}
	});

	socket.on('update', function(data) {
		players[socket.id].movement = data.movement;
	});

	socket.on('character selection', function(character) {
		console.log(character);
		if (!characters[character].isInUse) {
			players[socket.id].character = character;
			characters[character].isInUse = true;
			socket.emit('character selection', character);
			
		} else {
			socket.emit('character selection', 'nah');
		}
	});
	
	socket.on('disconnect', function() {
    	console.log('remove', socket.id);
    	clearInterval(gameInterval);
    	if (players[socket.id]) {
    		if (players[socket.id].character != 'none') {
    			characters[players[socket.id].character].isInUse = false;
    			delete players[socket.id];
    		}
    	}
  	});
});