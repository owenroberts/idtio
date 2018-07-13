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

		this.interfaceBubble = new Animation(data.bubble.src, true);
		this.interfaceBubble.load(false, () => {
			this.interfaceBubble.loop = false;
			this.interfaceBubble.states = data.bubble.states;
		});
		this.displayIcons = false;
		this.interfaceBubble.playStateCallback = function() {
			this.displayIcons = true;
		}.bind(this); /* fuck */

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
			if (this.interfaceBubble && this.displayInterface) {
				let x = this.position.x - this.width / 4;
				let y = this.position.y - this.height / 2;
				this.interfaceBubble.draw(x, y);
				if (this.displayIcons) {
					let i = 0;
					x += 20;
					y += 20;
					for (const key in Game.icons) {
						x += 40;
						if (this.resources[key].length > 0) {
							Game.icons[key].animation.setState('idle')
							Game.letters.setState(Game.icons[key].key);
							Game.letters.draw(x, y + 100);
						}
						else
							Game.icons[key].animation.setState('unavailable')
						Game.icons[key].animation.draw(x, y);
						i++;
					}
				}
			}
			if (this.displayStory) {
				this.stories[this.currentStory].draw(this.position.x, this.position.y);
			}
		}
	}

	playStory(src) {
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