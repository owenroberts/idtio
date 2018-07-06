const Entity = require('./Entity');

class Player extends Entity {
	constructor(socket) {
		super({ x: 0, y: 0, distance: 300 });
		this.joinedGame = false;
		this.input = {
			right: false,
			up: false,
			left: false,
			down: false,
			interact: false
		};
		this.bounds = {
			top: -4096,
			bottom: 4096,
			left: -8192,
			right: 8192
		};
		this.speed = 5;
		this.animationState = 'idle';
		this.isInteracting = false;
		this.id = socket.id;
		// this.socket = socket; /* test this again */
		socket.emit('id', socket.id);
		this.resources = {
			flower: [],
			skull: []
		};
		this.talking = false;
		this.resourceKey = {
			j: "flower",
			k: "skull"
		};

		/* not implemented */
		this.updateAnimation = false;
		this.updatePosition = false;
	}

	join(socket) {
		if (this.character) {
			this.joinedGame = true;
			socket.emit('join game');
			this.init(socket);
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

	hasResource(key) {
		return this.resources[this.resourceKey[key]].length > 0;
	}

	getResource(key) {
		return this.resourceKey[key];
	}
	
	update() {

		// if (!this.isInteracting) {
			this.animationState = 'idle';
			if (this.input.up) {
				if (this.y > this.bounds.top)
					this.y -= this.speed;
				this.animationState = 'up';
			}
			if (this.input.down) {
				if (this.y < this.bounds.bottom)
					this.y += this.speed;
				this.animationState = 'down';
			}
			if (this.input.right) {
				if (this.x < this.bounds.right)
					this.x += this.speed;
				this.animationState = 'right';
			}
			if (this.input.left) {
				if (this.x > this.bounds.left)
					this.x -= this.speed;
				this.animationState = 'left';
			}
			if (this.input.interact) {
				this.isInteracting = true;
			} else {
				this.isInteracting = false;
			}
			if (this.input.talk && this.hasResource(this.input.talk))
				this.talking = this.getResource(this.input.talk);

		// }
	}

	getUpdate() {
		this.update();
		return {
			id: this.id,
			character: this.character,
			animationState: this.animationState,
			x: this.x,
			y: this.y
		};
	}
}
module.exports = Player;