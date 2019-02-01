class Interactive extends Item {
	constructor(params, isPickup, debug) {
		super(params, debug);
		if (params.msg) {
			this.displayText = false;
			this.text = new Text(params.x, params.y, params.msg, params.wrap, Game.letters);
		}
		this.isActive = false;
		this.animation.loop = false;
		this.isPickup = isPickup;
		this.picked = true;
		this.label = params.label;
		this.randomState = params.random || false;
	}
	display() {
		super.display();
		if (this.displayText) {
			this.text.setPosition(this.position.x, this.position.y);
			const ended = this.text.display(true, true);
			if (ended) this.displayText = false;
		}
	}
	playInteractState(callback) {
		if (!this.isActive && this.animation.state != 'interact') {
			if (this.randomState) {
				const states = Object.keys(this.animation.states);
				this.animation.setState(states[Cool.randomInt(1, states.length - 1)]);
			} else {
				this.animation.setState('interact');
			}
			if (this.text) this.displayText = true; // if needs text/message, some dont
			// this.isActive = true;
			this.animation.playOnce(() => {
				this.animation.setState(this.isPickup ? 'end' : 'idle');
				this.isActive = false;
				if (this.isPickup)
					this.picked = true;
			});
		}
	}
}