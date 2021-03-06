const Entity = require('./Entity');

class Player extends Entity {
	constructor(socket) {
		super({ x: 0, y: 0, distance: 250 });
		this.id = socket.id;
		socket.emit('id', socket.id);
		this.joinedGame = false;
		this.input = { right: false, up: false, left: false, down: false };
		this.bounds = { top: -10788, bottom: 14103, left: -22702, right: 14476 };
		this.speed = 5;
		this.animationState = 'idle';

		this.waving = false;
		this.isInteracting = false;

		this.resources = { flower: [], skull: [], heart: [] };
		this.usedResources = { flower: [], skull: [], heart: [] };
		this.resourceKey = { j: "flower", k: "skull", l: "heart" };

		/* not implemented */
		this.updateAnimation = false;
		this.updatePosition = false;

		this.timeoutCount = 0;
	}

	reset() {
		this.playersInRange = [];
		this.joinedGame = false;
		this.character = undefined;
		this.isInteracting = false;
		this.x = 0;
		this.y = 768;
		this.timeoutCount = 0;
	}

	returnResources() {
		let resources = [];
		for (var r in this.resources) {
			resources = resources.concat( this.resources[r] );
			resources = resources.concat( this.usedResources[r] );
			this.resources[r] = [];
			this.usedResources[r] = [];
		}
		return resources;
	}

	setBounds(width, height) {
		/* window width and height */
		this.bounds.top += height;
		this.bounds.bottom -= height;
		this.bounds.left += width;
		this.bounds.right -= width;
	}

	join(character, socket) {
		this.joinedGame = true;
		this.character = character;
		this.init(socket);
	}

	endDialog() {
		this.isInteracting = false;
	}

	init(socket) {
		/* handle key input from player */
		socket.on('key movement', (key) => {
			this.input[key.input] = key.state;
			this.timeoutCount = 0;
		});

		socket.on('key wave', (state) => {
			this.waving = true;
			this.timeoutCount = 0;
		});

		socket.on('done interacting', () => {
			if (this.waving) this.waving = false;
		});

		socket.on('done talking', () => {
			this.endDialog();
		});
	}

	hasResource(key) {
		return this.resources[this.resourceKey[key]].length > 0;
	}

	getResourceType(key) {
		return this.resourceKey[key];
	}
	
	update() {
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