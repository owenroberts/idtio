class Text {
	constructor(x, y, msg, wrap) {
		this.x = x;
		this.y = y;
		this.msg = msg;
		this.wrap = wrap;
		this.active = true;
	}
	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}
	display() {
		if (this.active) {
			let x = this.x;
			let y = this.y - Math.floor((this.msg.length - 1) / this.wrap) * 35;

			for (let i = 0; i < this.msg.length; i++) {
				var letter = this.msg[i];
				if (letter == ' ') {
					x += 30;
				} else {
					Game.letters.setState(letter);
					Game.letters.draw(x, y);
					x += 18;
				}
				if (i != 0 && i % this.wrap == 0) {
					y += 35;
					x = this.x;
				}
			}
		}
	}
}

