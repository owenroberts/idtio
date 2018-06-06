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

const characters = {
	scratch: { isInUse: false },
	cat: { isInUse: false }
};

class Player {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.joinedGame = false;
		this.movement = {
			right: false,
			up: false,
			left: false,
			down: false
		};
		this.speed = 5;
		this.animationState = 'idle';
	}

	connect(socket) {
		socket.emit('id', socket.id);
		/* player should select character */
		socket.on('character selection', (character) => {
			/* assign if character not being used */
			if (!characters[character].isInUse && !this.character) {
				this.character = character;
				characters[character].isInUse = true;
			} else if (this.character == character) {
				socket.emit('msg', 'you have selected that character');
			} else {
				/* else need to message them */
				socket.emit('msg', 'character not available');
			}
		});

		/* when player clicks join game */
		socket.on('join', () => {
			if (players[socket.id].character) {
				socket.emit('join game');
				this.init(socket);
				io.sockets.emit('add character', this, socket.id);
				this.joinedGame = true;
				/* if this is the first player to join start gameInterval */
				if (Object.keys(players).length == 1)
					gameInterval = setInterval(gameUpdate, 1000 / 60);
				/* if not add the other players */
				else 
					for (const id in players) {
						if (id != socket.id && players[id].joinedGame)
							socket.emit('add character', players[id]);
					}

			} else {
				socket.emit('msg', 'Please select a character');
			}
		});
	}

	init(socket) {
		/* handle key input from player */
		socket.on('key', (key) => {
			this.movement[key.input] = key.state;			
		});
	}
	
	update() {
		this.animationState = 'idle';
		if (this.movement.up) {
			this.y -= this.speed;
			this.animationState = 'up';
		}
		if (this.movement.down) {
			this.y += this.speed;
			this.animationState = 'down';
		}
		if (this.movement.right) {
			this.x += this.speed;
			this.animationState = 'right';
		}
		if (this.movement.left) {
			this.x -= this.speed;
			this.animationState = 'left';
		}
	}
}
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
	/* new connection, create a player */
	socket.on('new', function() {
		console.log('new', socket.id);
		players[socket.id] = new Player();
		players[socket.id].connect(socket);
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