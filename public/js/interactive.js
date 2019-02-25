class Interactive extends Item {
	constructor(params, isPickup, debug) {
		super(params, params.src, debug);
		this.isActive = false;
		this.animation.loop = false;
		this.isPickup = isPickup;
		this.picked = true;
		this.label = params.label;
		this.randomState = params.random || false;
	}

	playInteractState(callback) {
		if (!this.isActive && this.animation.state != 'interact') {
			if (this.randomState) {
				const states = Object.keys(this.animation.states);
				this.animation.setState(states[Cool.randomInt(1, states.length - 1)]);
			} else {
				this.animation.setState('interact');
			}
			this.displayMessage(true, true);
			// this.isActive = true;
			this.animation.playOnce(() => {
				this.animation.setState(this.isPickup ? 'end' : 'idle');
				this.isActive = false;
				if (this.isPickup)
					this.picked = true;
			});
		}
	}

	return() {
		this.animation.setState('reborn');
		this.animation.placeOnce(() => {
			this.animation.setState('idle');
		});
	}
}