class Item {
	constructor(x, y, src, debug) {
		this.x = x;
		this.y = y;
		this.sprite = new Sprite(x, y);
		this.sprite.debug = debug;
		this.sprite.addAnimation(src, function() {
			this.sprite.center();
		}.bind(this));
	}
	display() {

		this.sprite.display();
	}
	update(offset) {
		this.sprite.position.x = this.x + offset.x;
		this.sprite.position.y = this.y + offset.y;
		this.sprite.center();
	}
}

class Interactive extends Item {
	constructor(x, y, src, debug, text) {
		super(x, y, src, debug);
		this.text = text;
		this.displayText = false;
	}
	display() {
		this.sprite.display();
		if (this.displayText) {
			this.text.setPosition(this.sprite.position.x, this.sprite.position.y - 40);
			this.text.display();
		}
	}
}