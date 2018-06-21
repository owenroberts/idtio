class Item {
	constructor(params, debug) {
		this.x = params.x;
		this.y = params.y;
		this.sprite = new Sprite(params.x, params.y);
		this.sprite.debug = debug;
		this.sprite.addAnimation(params.file, function() {
			this.sprite.center();
		}.bind(this));
		if (params.states) {
			this.sprite.animation.states = params.states;
			this.sprite.animation.state = 'idle';
		}
	}
	display() {
		this.sprite.display();
	}
	update(offset) {
		this.sprite.position.x = this.x + offset.x;
		this.sprite.position.y = this.y + offset.y;
		this.sprite.center();
	}
}

class Interactive extends Item {
	constructor(params, debug) {
		super(params, debug);
		this.text = params.text;
		this.displayText = false;
		this.text = new Text(params.x, params.y, params.msg, params.wrap);
		this.interacting = false;
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
		if (!this.interacting) {
			this.sprite.animation.setState('interact');
			this.displayText = false;
			this.interacting = true;
			this.sprite.animation.playOnce(() => {
				this.sprite.animation.setState(this.pickup ? 'end' : 'idle');
				this.interacting = false;
				if (this.pickup)
					this.picked = true;
			});
		}
	}
}

class Pickup extends Interactive {
	constructor(params, debug) {
		super(params, debug);
		this.pickup = true;
		this.picked = false;
	}
}