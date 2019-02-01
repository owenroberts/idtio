const Entity = require('./Entity');

class Interactive extends Entity {
	constructor(params) {
		super(params);
		this.msg = params.msg;
		this.label = params.label;
		this.type = params.type || 'interactive';
		/* do i need to know label and type? */
		this.triggered = false;
	}
}

module.exports = Interactive;