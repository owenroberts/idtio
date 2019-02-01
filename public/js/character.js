class Character extends Sprite {
	constructor(params, data, isPlayer, debug) {
		super(params.x, params.y);
		this.debug = debug;

		if (isPlayer) { 
			this.position.x = Game.width / 2;
			this.position.y = Game.height / 2;
		}

		this.addAnimation(data.walk.src, () => {
			if (isPlayer)
				this.center();
			this.animation.states = data.walk.states;
			this.animation.state = 'idle';
		});

		this.resources = params.resources;
		this.displayStory = false;
		
		// this.stories = {};

		this.letters = new Animation(data.letters.src, false);
		this.letters.load(false);
		const map = { "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7, "i":8, "j":9, "k":10, "l":11, "m":12, "n":13, "o":14, "p":15, "q":16, "r":17, "s":18, "t":19, "u":20, "v":21, "w":22, "x":23, "y":24, "z":25, "?": 26, ".": 27, ",": 28, "'": 29 };
		for (const key in map) {
			this.letters.createNewState(key, map[key], map[key]);
		}

		// dialog box 
		this.story = new Text(this.position.x, this.position.y, "", 10, this.letters);
		
		this.box = new Animation(data.box.src, false);
		this.box.load(false, () => {
			this.box.loop = false;
			this.box.states = data.box.states;
		});
		this.displayBox = false;
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
			if (this.displayBox) this.box.draw(x, this.position.y);
			if (this.displayStory) {
				const ended = this.story.display(true, false, x, this.position.y - 35);
				if (ended) {
					this.displayStory = false;	
					this.toggleBox(false);
					if (this.story.callback) this.story.callback();
				}
			}
		}
	}

	toggleBox(state) { /* speech bubble */
		if (state) {
			this.displayBox = true;
			this.box.setState('forward');
		} else {
			this.box.setState('reverse');
			this.box.playOnce(() => {
				this.displayBox = false;
			});
		}
	}

	playStory(dialog, callback) {
		this.toggleBox(true);
		this.iconType = false;
		this.displayStory = true;
		this.story.setMsg(dialog);
		this.story.count = 0;
		this.story.end = 0;
		this.story.length = dialog.length;
		this.story.callback = callback;
	}

	endStory() {
		this.displayStory = false;
	}
}