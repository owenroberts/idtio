class UI extends Sprite {
	constructor(params, debug) {
		super(params.x, params.y);
		this.debug = debug;
		this.addAnimation(params.src, () => {
			if (params.state) this.animation.setState(params.state);
		});
		this.selected = params.selected || false;
		this.animation.states = params.states;
		this.animation.state = 'idle';
		this.clickStart = false;
		if (params.func) this.func = window[params.func];
	}
	toggle(selected) {
		this.selected = selected;
		this.animation.setState(selected ? 'selected' : 'idle')
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
		let callbacked = false;
		if (!this.selected) {
			if (this.tap(x,y) && this.clickStart) {
				this.animation.setState('over');
				document.body.style.cursor = 'pointer';
				if (this.callback) this.callback();
				if (this.func) this.func();
				callbacked = true;
			}
		}
		this.clickStart = false;
		return callbacked;
	}
	event(x, y) {
		if (this.tap(x, y)) {
			if (this.callback) 
				this.callback();
		}
	}
}
