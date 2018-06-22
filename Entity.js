class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.msg = params.msg;
		this.label = params.label;
		this.playersInRange = []; // player is currently in range // do i need to know this?
		this.type = params.type;
		this.triggered = false;

		/* not sure this is the best way to do it */
		this.isPickup = false;
		this.picked = false;
	}

	checkInRange(player, callback) {
		const _x = player.x - this.x;
		const _y = player.y - this.y;
		const isInRange = Math.sqrt(_x * _x + _y * _y) < this.distance;
		const playerIndex = this.playersInRange.indexOf(player.id);
		const wasInRange = playerIndex != -1;
		if (wasInRange) {
			if (!isInRange) {
				this.playersInRange.splice(playerIndex, 1);
				callback('exited');
			} else {
				callback('inrange');
			}
		} else {
			if (isInRange) {
				this.playersInRange.push(player.id);
				callback('entered');
			}
		}
	}

	displayInteractMessage(state, socket) {
		socket.emit('display interact message', { label: this.label, type: this.type, state: state });
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