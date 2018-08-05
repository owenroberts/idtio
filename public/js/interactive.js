class Interactive extends Item {
	constructor(params, debug) {
		super(params, debug);
		this.text = params.text;
		this.displayText = false;
		this.text = new Text(params.x, params.y, params.msg, params.wrap, Game.letters);
		this.isActive = false;
		this.animation.loop = false;
		this.isPickup = false;
		this.picked = true;
		this.label = params.label;
		this.randomState = params.random;
	}
	display() {
		super.display();
		if (this.displayText) {
			this.text.setPosition(this.position.x, this.position.y);
			this.text.display();
		}
	}
	playInteractState(callback) {
		if (!this.isActive) {
			if (this.randomState) {
				const states = Object.keys(this.animation.states);
				this.animation.setState(states[Cool.randomInt(1, states.length - 1)]);
			} else {
				this.animation.setState('interact');
			}
			this.displayText = false;
			this.isActive = true;
			this.animation.playOnce(() => {
				this.animation.setState(this.isPickup ? 'end' : 'idle');
				this.isActive = false;
				if (this.isPickup)
					this.picked = true;
			});
		}
	}
}