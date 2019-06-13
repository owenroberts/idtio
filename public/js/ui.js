class UI extends Sprite {
	constructor(params, debug) {
		let x = params.x;
		let y = params.y;
		if (x % 1 != 0) x = Game.width * x;
		if (x < 0) x = Game.width + x;
		if (y % 1 != 0) y = Game.height * y;
		if (y < 0) y = Game.height + y;
		super(x, y);
		this.debug = debug;
		if (params.hidden) this.alive = false;
		this.addAnimation(params.src, () => {
			if (params.state) this.animation.setState(params.state);
		});
		this.selected = params.selected || false;
		if (params.states) {
			this.animation.states = params.states;
			this.animation.state = 'idle';
		}
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
				return true;
			} else {
				this.animation.setState('idle');
				this.clickStart = false;
				return false;
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
