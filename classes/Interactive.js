const Entity = require('./Entity');

class Interactive extends Entity {
	constructor(params) {
		super(params);
		this.msg = params.msg;
		this.label = params.label;
		this.type = params.type || 'interactive';
		this.resource = params.resource;
		this.isInteracting = false;

		/* not sure this is the best way to do it */
		this.isPickup = false;
		this.picked = false; /* fuck */
	}
}

module.exports = Interactive;