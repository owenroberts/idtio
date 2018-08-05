const Entity = require('./Entity');

class Player extends Entity {
	constructor(socket) {
		super({ x: 0, y: 768, distance: 250 });
		this.id = socket.id;
		socket.emit('id', socket.id);
		this.joinedGame = false;
		this.input = { right: false, up: false, left: false, down: false };
		this.bounds = { top: -3596, bottom: 4026, left: -8192, right: 7168 };
		this.speed = 5;
		this.animationState = 'idle';

		this.act = {
			inItemRange: false,
			withItem: false,
			inPlayerRange: false,
			inputStoryType: false,
			storyTypeSent: false,
			storyStarted: false
		};

		this.resources = { flower: [], skull: [], apple: [] };
		this.usedResources = { flower: [], skull: [], apple: [] };
		this.resourceKey = { j: "flower", k: "skull", l: "apple" };

		/* not implemented */
		this.updateAnimation = false;
		this.updatePosition = false;
	}

	reset() {
		this.playersInRange = [];
		this.joinedGame = false;
		this.character = undefined;
		for (const a in this.act) {
			this.act[a] = false;
		}
		this.x = 0;
		this.y = 0;
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
		this.bounds.top -= height;
		this.bounds.bottom -= height;
		this.bounds.left -= width;
		this.bounds.right -= width;
	}

	join(character, socket) {
		this.joinedGame = true;
		this.character = character;
		this.init(socket);
	}

	endDialog() {
		this.act.inPlayerRange = false; /* could still be in player range? */
		this.act.inputStoryType = false;
		this.act.storyTypeSent = false;
		this.act.storyStarted = false;
	}

	init(socket) {
		/* handle key input from player */
		socket.on('key movement', (key) => {
			this.input[key.input] = key.state;	
		});

		socket.on('key interact', (state) => {
			this.act.withItem = state;
		});

		socket.on('key choose dialog', (key) => {
			if (this.hasResource(key))
				this.act.inputStoryType = this.getResourceType(key);
		})

		socket.on('done interacting', () => {
			this.act.withItem = false;
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