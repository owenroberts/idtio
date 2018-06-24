class Interactive extends Item {
	constructor(params, debug) {
		super(params, debug);
		this.text = params.text;
		this.displayText = false;
		this.text = new Text(params.x, params.y, params.msg, params.wrap);
		this.isActive = false;
		this.sprite.animation.loop = false;
	}
	display() {
		this.sprite.display();
		if (this.displayText) {
			this.text.setPosition(this.sprite.position.x, this.sprite.position.y - 40);
			this.text.display();
		}
	}
	playInteractState(callback) {
		if (!this.isActive) {
			this.sprite.animation.setState('interact');
			this.displayText = false;
			this.isActive = true;
			this.sprite.animation.playOnce(() => {

				this.sprite.animation.setState(this.pickup ? 'end' : 'idle');
				console.log('end');
				this.isActive = false;
				if (this.isPickup)
					this.picked = true;
			});
		}
	}
}