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
				this.text = new Text(this.x, this.y, params.msg, params.wrap, Game.letters);
			}
		});
		if (params.states) {
			this.animation.states = params.states;
			this.animation.state = params.state || 'idle';
		}
		if (params.r) this.animation.randomFrames = true;
	}

	display(isMap) {
		if (this.isOnScreen()) { /* this could be permanent to sprite.js in Game ? */
			super.display();
			if (this.displayText) {
				const ended = this.text.display(true, true);
				if (ended && this.endText) this.displayText = false;
			}
		} else if (Game.map) {
			super.display(true); // temp fix
		}
	}

	displayMessage(show, end) {
		if (this.text) {
			this.displayText = show; // if needs text/message, some dont
			this.endText = end;
		}	
	}

	isOnScreen() {
		if (this.position.x + this.width > 0 && 
			this.position.y + this.height > 0 &&
			this.position.x < Game.width &&
			this.position.y < Game.height)
			return true;
		else
			return false;
	}

	update(offset) {
		this.position.x = this.x + offset.x;
		this.position.y = this.y + offset.y;
		this.center();
		if (this.text) this.text.setPosition(this.position.x + this.width/2, this.position.y);
	}
}