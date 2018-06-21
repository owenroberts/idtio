class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.msg = params.msg;
		this.label = params.label;
		this.players = []; // player is currently in range // do i need to know this?
		this.type = params.type;
		this.triggered = false;
		this.isPickup = false;
		this.picked = false;
	}

	get(player, callback) {
		const _x = player.x - this.x;
		const _y = player.y - this.y;
		const d = Math.sqrt(_x * _x + _y * _y) < this.distance;
		const i = this.players.indexOf(player.id);
		if (i != -1) {
			if (!d) {
				this.players.splice(i, 1);
				callback('exit');
			}
		} else {
			if (d) {
				this.players.push(player.id);
				callback(this.msg);
			}
		}
	}

	displayInteractMessage(state, socket) {
		socket.emit('interactive text', { label: this.label, type: this.type, state: state });
	}
}

class Pickup extends Entity {
	constructor(params) {
		super(params);
		this.picked = false;
		this.isPickup = true;
	}
}

module.exports = {
	Entity: Entity,
	Pickup: Pickup
};