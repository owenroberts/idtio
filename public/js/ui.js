class UI extends Sprite {
	constructor(params, debug) {
		super(params.x, params.y);
		this.debug = debug;
		this.addAnimation(params.src, () => {
			// this.center();
		});
		this.selected = false;
		this.animation.states = params.states;
		this.animation.state = 'idle';
		this.clickStart = false;
	}
	setChosen() {
		this.animation.setState('selected');
		this.selected = true;
	}
	setUnchosen() {
		this.animation.setState('idle');
		this.selected = false;
	}
	over(x, y) {
		if (!this.selected) {
			if (this.tap(x,y)) {
				this.animation.setState('over');
				document.body.style.cursor = 'pointer'; /* maybe make this a game or UI method? */
			} else {
				this.animation.setState('idle');
				document.body.style.cursor = 'default';
				this.clickStart = false;
			}
		}
	}
	down(x, y) {
		if (!this.selected) {
			if (this.tap(x,y)) {
				this.animation.setState('active');
				document.body.style.cursor = 'pointer';
				this.clickStart = true;
			}
		}
	}
	up(x, y) {
		if (!this.selected) {
			if (this.tap(x,y) && this.clickStart) {
				this.animation.setState('over');
				document.body.style.cursor = 'pointer';
				this.callback();
			}
		}
		this.clickStart = false;
	}
	event(x, y) {
		if (this.tap(x, y)) {
			if (this.callback) 
				this.callback();
		}
	}
}
