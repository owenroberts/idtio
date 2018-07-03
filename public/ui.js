class UI extends Sprite {
	constructor(params, debug) {
		super(Game.width/2 + params.x, Game.height/2 + params.y);
		this.debug = debug;
		this.addAnimation(params.src, () => {
			this.center();
		});
		this.selected = false;
		this.animation.states = params.states;
		this.animation.state = 'idle';
	}
	select() {
		this.animation.setState('selected');
		this.selected = true;
	}
	setChosen() {
		this.animation.setState('active');
		this.selected = true;
	}
	over(x, y) {
		if (!this.selected) {
			if (this.tap(x,y)) {
				this.animation.setState('over');
				document.body.style.cursor = 'pointer'; /* maybe make this a game or UI method? */
			} else {
				this.animation.setState('idle');
				document.body.style.cursor = 'default';
			}
		}
	}
	down(x, y) {
		if (!this.selected) {
			if (this.tap(x,y)) {
				this.animation.setState('active');
				document.body.style.cursor = 'pointer';
			}
		}
	}
	up(x, y) {
		if (!this.selected) {
			if (this.tap(x,y)) {
				this.animation.setState('over');
				document.body.style.cursor = 'pointer';
			}
		}
	}
	event(x, y) {
		if (this.tap(x, y)) {
			if (this.callback) 
				this.callback();
		}
	}
}
