const Interactive = require('./Interactive');

class Pickup extends Interactive {
	constructor(params) {
		super(params);
		this.picked = false;
		this.isPickup = true;
	}

	getUpdate() {
		return {
			label: this.label,
			picked: this.picked
		}
	}
}

module.exports = Pickup;