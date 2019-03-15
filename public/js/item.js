class Item extends Sprite {
	constructor(params, src, debug) {
		super(params.x, params.y);
		this.x = params.x;
		this.y = params.y;
		this.debug = debug;
		this.addAnimation(src, () => {
			this.center();
			if (params.msg) {
				this.displayText = false;
				this.endText = true;
				this.text = new Text(this.x, this.y, params.msg.toLowerCase(), params.wrap, Game.letters);
			}
		});
		if (params.states) {
			this.animation.states = params.states;
			this.animation.state = params.state || 'idle';
		}
		if (params.r) this.animation.randomFrames = true;
	}

	display() {
		super.display(Game.map); /* temp fix for map to display any sprite */
		if (this.displayText) {
			const ended = this.text.display(true, true);
			if (ended && this.endText) this.displayText = false;
		}
	}

	update(offset) {
		this.position.x = this.x + offset.x;
		this.position.y = this.y + offset.y;
		this.center();
		if (this.text) this.text.setPosition(this.position.x + this.width/2, this.position.y + this.height/4);
	}

	displayMessage(show, end) {
		if (this.text) {
			this.displayText = show; // if needs text/message, some dont
			this.endText = end;
		}	
	}
}