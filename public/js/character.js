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

		this.interface = new Animation(data.bubble.src, false);
		this.interface.load(false, () => {
			this.interface.loop = false;
			this.interface.states = data.bubble.states;
		});
		this.displayInterface = false;
		this.displayIcons = false;
		this.interface.onPlayedState = function() {
			this.displayIcons = true;
		}.bind(this); /* fuck */
		this.iconType = false;

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
		this.storyCount = 0;
		this.storyLength = 0;
		this.storyEnd = 0;
		this.storyFrameCount = 0;
		this.storyCallback;
		this.box = new Animation(data.box.src, false);
		this.box.load(false, () => {
			this.box.loop = false;
			this.box.states = data.box.states;
		});
		this.displayBox = false;
		
	}

	display() {
		if (this.position.x + this.width > 0 && 
			this.position.y + this.height > 0 &&
			this.position.x < Game.width &&
			this.position.y < Game.height) {
			super.display();
			let x = this.position.x - this.width / 4;
			let y = this.position.y - this.height / 2;
			if (this.interface && this.displayInterface)
				this.interface.draw(x, y);
			if (this.displayIcons || this.iconType) {
				let i = 0;
				x += 20;
				y += 20;
				for (const key in Game.icons) {
					if (key == this.iconType) {
						Game.icons[key].animation.setState('over');
						Game.icons[key].animation.draw(x, y);
					}
					if (this.displayIcons) {
						if (this.resources[key].length > 0) {
							Game.icons[key].animation.setState('idle');
							Game.letters.setState(Game.icons[key].key);
							Game.letters.draw(x + 30, y + 90);
						} else {
							Game.icons[key].animation.setState('select');
						}
						Game.icons[key].animation.draw(x, y);
					}
					i++;
					x += 90;
				}
			}
			if (this.displayBox)
				this.box.draw(x, this.position.y);
			if (this.displayStory) {
				this.story.display(this.storyCount, x, this.position.y - 35);
				this.storyFrameCount++;
				if (this.storyFrameCount == 1) {
					this.storyFrameCount = 0;
					if (this.storyEnd > 3) {
						this.displayStory = false;	
						this.toggleBox(false);
						this.storyCallback();
					} if (this.storyCount == this.storyLength) {
						this.storyEnd++;						
					} else {
						this.storyCount++;
					}
				}
			}
		}
	}

	toggleInterface(state) {
		if (state) {
			this.displayInterface = true;
			this.interface.setState('forward');
		} else {
			this.displayIcons = false;
			this.interface.setState('reverse');
			this.interface.playOnce(() => {
				this.displayInterface = false;
			});
		}
	}

	toggleBox(state) {
		if (state) {
			this.displayBox = true;
			this.box.setState('forward');
		} else {
			this.displayBox = false;
			this.box.setState('reverse');
			this.box.playOnce(() => {
				this.displayBox = false;
			});
		}
	}

	setStoryType(type) {
		this.iconType = type;
		this.toggleInterface(false);
	}

	playStory(dialog, callback) {
		this.iconType = false;
		this.displayStory = true;
		this.story.setMsg(dialog);
		this.storyCount = 0;
		this.storyEnd = 0;
		this.storyLength = dialog.length;
		this.storyCallback = callback;
	}

	endStory() {
		this.displayStory = false;
	}
}