class Toggle extends UI {
	constructor(params, debug) {
		super(params, debug);
		this.toggled = false;
		this.on = "idle",
		this.off = "active";
	}
	setOnOff() {
		if (this.toggled) this.animation.setState(this.on);
		else this.animation.setState(this.off);
	}
	over(x, y) {
		if (this.tap(x,y)) {
			this.animation.setState('over');
			document.body.style.cursor = 'pointer';
		} else {
			this.setOnOff();
			document.body.style.cursor = 'default';
			this.clickStart = false;
		}
	}
	down(x, y) {
		if (this.tap(x,y)) {
			this.animation.setState('selected');
			document.body.style.cursor = 'pointer';
			this.clickStart = true;
		}
	}
	up(x, y) {
		if (this.tap(x,y) && this.clickStart) {
			this.toggled = !this.toggled;
			this.setOnOff();
			document.body.style.cursor = 'pointer';
			if (this.func) this.func();
		}
		this.clickStart = false;
	}
}