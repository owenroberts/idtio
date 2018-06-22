class Player {
	constructor(socket) {
		this.x = 0;
		this.y = 0;
		this.joinedGame = false;
		this.input = {
			right: false,
			up: false,
			left: false,
			down: false,
			interact: false
		};
		this.speed = 5;
		this.animationState = 'idle';
		this.isInteracting = false;
		this.id = socket.id;
		// this.socket = socket; /* test this again */
		socket.emit('id', socket.id);
		this.resources = {
			flower: []
		}
		this.updateAnimation = false;
		this.updatePosition = false;
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
			this.input[key.input] = key.state;			
		});

		socket.on('done interacting', () => {
			this.isInteracting = false;
		});
	}
	
	update() {
		// if (!this.isInteracting) {
			this.animationState = 'idle';
			if (this.input.up) {
				this.y -= this.speed;
				this.animationState = 'up';
			}
			if (this.input.down) {
				this.y += this.speed;
				this.animationState = 'down';
			}
			if (this.input.right) {
				this.x += this.speed;
				this.animationState = 'right';
			}
			if (this.input.left) {
				this.x -= this.speed;
				this.animationState = 'left';
			}
			if (this.input.interact) {
				this.isInteracting = true;
			}
		// }
	}

	getUpdate() {
		this.update();
		return {
			id: this.id,
			animationState: this.animationState,
			x: this.x,
			y: this.y
		};
	}
}
module.exports = Player;