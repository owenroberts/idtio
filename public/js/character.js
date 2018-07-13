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

		this.interface = new Animation(data.bubble.src, true);
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
		this.stories = {};
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
					x += 40;
					if (key == this.iconType) {
						Game.icons[key].animation.setState('over');
						Game.icons[key].animation.draw(x, y);
					}
					if (this.displayIcons) {
						if (this.resources[key].length > 0) {
							Game.icons[key].animation.setState('idle');
							Game.letters.setState(Game.icons[key].key);
							Game.letters.draw(x, y + 100);
						}
						else
							Game.icons[key].animation.setState('unavailable');
						Game.icons[key].animation.draw(x, y);
					}
					i++;
				}
			}
			if (this.displayStory) {
				this.stories[this.currentStory].draw(x, y);
			}
		}
	}

	toggleInterface(state) {
		if (state) {
			this.displayInterface = true;
			this.interface.setState('forward');
		} else {
			this.interface.setState('reverse');
			this.displayIcons = false;
			this.interface.playOnce(() => {
				this.displayInterface = false;
			});
		}
	}

	setStoryType(type) {
		this.iconType = type;
		this.toggleInterface(false);
	}

	playStory(src) {
		this.iconType = false;
		this.toggleInterface(false);
		if (this.stories[src]) {
			this.displayStory = true;
			this.currentStory = src;
			this.stories[src].playOnce(() => {
				this.displayStory = false;
			});
		} else {
			this.stories[src] = new Animation('/public/drawings/story/' + src + '.json', false);
			this.stories[src].load(false, () => {
				this.displayStory = true;
				this.currentStory = src;
				this.stories[src].playOnce(() => {
					this.displayStory = false;
				});
			});
		}
	}
}