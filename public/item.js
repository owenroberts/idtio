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