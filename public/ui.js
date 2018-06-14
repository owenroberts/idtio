class UI {
	constructor(x, y, src, debug) {
		this.sprite = new Sprite(x, y);
		this.sprite.debug = debug;
		this.sprite.addAnimation(src, function() {
			this.sprite.center();
		}.bind(this));
		this.sprite.animation.states = {
			idle: { start: 0, end: 0 },
			over: { start: 1, end: 1 },
			active: { start: 2, end: 2 },
			selected: { start: 2, end: 2 }
		};
		this.sprite.animation.state = 'idle';
		this.selected = false;
	}
	display() {
		this.sprite.display();
	}
	select() {
		this.sprite.animation.state = 'selected';
		this.selected = true;
	}
	over(x, y) {
		if (!this.selected) {
			if (this.sprite.tap(x,y)) {
				this.sprite.animation.changeState('over');
				document.body.style.cursor = 'pointer';
			} else {
				this.sprite.animation.changeState('idle');
				document.body.style.cursor = 'default';
			}
		}
	}
	down(x, y) {
		if (!this.selected) {
			if (this.sprite.tap(x,y)) {
				this.sprite.animation.changeState('active');
				document.body.style.cursor = 'pointer';
			}
		}
	}
	up(x, y) {
		if (!this.selected) {
			if (this.sprite.tap(x,y)) {
				this.sprite.animation.changeState('over');
				document.body.style.cursor = 'pointer';
			}
		}
	}
	event(x, y) {
		if (this.sprite.tap(x, y)) {
			if (this.callback) 
				this.callback();
		}
	}
}
