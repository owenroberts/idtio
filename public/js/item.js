class Item extends Sprite {
	constructor(params, debug) {
		super(params.x, params.y);
		this.x = params.x;
		this.y = params.y;
		this.debug = debug;
		this.addAnimation(params.src, () => {
			this.center();
		});
		if (params.states) {
			this.animation.states = params.states;
			this.animation.state = 'idle';
		}
	}

	display() {
		if (this.position.x + this.width > 0 && 
			this.position.y + this.height > 0 &&
			this.position.x < Game.width &&
			this.position.y < Game.height)
			super.display();
	}

	update(offset) {
		this.position.x = this.x + offset.x;
		this.position.y = this.y + offset.y;
		this.center();
	}
}