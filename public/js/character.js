class Character extends Sprite {
	constructor(params, data, isPlayer, debug) {
		super(params.x, params.y);
		this.debug = debug;

		if (isPlayer) { 
			this.position.x = Game.width / 2;
			this.position.y = Game.height / 2;
		}

		this.addAnimation(data.src, () => {
			if (isPlayer)
				this.center();
			this.animation.states = data.states;
			this.animation.state = 'idle';
		});

		this.resources = params.resources;

		this.letters = new Animation(data.letters.src, false);
		this.letters.load(false);
		const map = { "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7, "i":8, "j":9, "k":10, "l":11, "m":12, "n":13, "o":14, "p":15, "q":16, "r":17, "s":18, "t":19, "u":20, "v":21, "w":22, "x":23, "y":24, "z":25, "?": 26, ".": 27, ",": 28, "'": 29 };
		for (const key in map) {
			this.letters.createNewState(key, map[key], map[key]);
		}

		// dialog bubble 
		this.story = new Text(this.position.x, this.position.y, "", 10, this.letters);
		this.story.alive = false;
		this.bubble = new Animation(data.bubble.src, false);
		this.bubble.load(false, () => {
			this.bubble.loop = false;
			this.bubble.states = data.bubble.states;
		});
		this.bubble.alive = false;
	}

	isOnscreen() {
		if (this.position.x + this.width > 0 && 
			this.position.y + this.height > 0 &&
			this.position.x < Game.width &&
			this.position.y < Game.height)
			return true;
		else
			return false;
	}

	display() {
		if (this.isOnscreen) {
			super.display();
			let x = this.position.x - this.width / 4;
			let y = this.position.y - this.height / 2;
			if (this.bubble.alive) this.bubble.draw(x, this.position.y);
			if (this.story.alive) {
				const ended = this.story.display(true, false, x, this.position.y - 35);
				if (ended) {
					this.story.alive = false;	
					this.toggleBubble(false);
					if (this.story.callback) this.story.callback();
				}
			}
		}
	}

	toggleBubble(state) { /* speech bubble */
		if (state) {
			this.bubble.alive = true;
			this.bubble.setState('forward');
		} else {
			this.bubble.setState('reverse');
			this.bubble.playOnce(() => {
				this.bubble.alive = false;
			});
		}
	}

	playStory(dialog, callback) {
		this.toggleBubble(true);
		this.iconType = false;
		this.story.alive = true;
		this.story.setMsg(dialog);
		this.story.count = 0;
		this.story.end = 0;
		this.story.length = dialog.length;
		this.story.callback = callback;
	}

	playAnimation(type) {
		this.isInteracting = true;
		this.animation.setState(type);
		this.animation.playOnce(() => {
			this.animation.setState('idle');
			socket.emit('done interacting'); // global?
			this.isInteracting = false;
		});
	}

	endStory() {
		this.displayStory = false;
	}
}