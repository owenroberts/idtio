class Item {
	constructor(params, debug) {
		this.x = params.x;
		this.y = params.y;
		this.sprite = new Sprite(params.x, params.y);
		this.sprite.debug = debug;
		this.sprite.addAnimation(params.file, function() {
			this.sprite.center();
		}.bind(this));
		this.sprite.animation.states = params.states;
		this.sprite.animation.state = 'idle';
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
	playInteractState() {
		this.sprite.animation.changeState('interact');
		this.sprite.animation.playOnce = true;
		this.sprite.animation.frameCount = 0;
		this.sprite.animation.playOnceCallback = function() {
			this.sprite.animation.playOnce = false;
			this.sprite.animation.frameCount = -1;  // not sure what the point of this is
			this.sprite.animation.changeState('idle');
			this.interacting = false;
		}.bind(this);
		this.displayText = false;
		this.interacting = true;
	}
}