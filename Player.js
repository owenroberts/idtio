class Player {
	constructor(socket) {
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
		this.id = socket.id;
		socket.emit('id', socket.id);
	}

	setText(label, state, socket) {
		socket.emit('interactive text', { label: label, state: state });
	}

	join(socket) {
		if (this.character) {
			socket.emit('join game');
			this.init(socket);
			this.joinedGame = true;
			return true;
		} else {
			socket.emit('msg', 'Please select a character');
			return false;
		}
	}

	init(socket) {
		/* handle key input from player */
		socket.on('key', (key) => {
			this.movement[key.input] = key.state;			
		});

/*		socket.on('interact', () => {
			
		});*/
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
module.exports = Player;