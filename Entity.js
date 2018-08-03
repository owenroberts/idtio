class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.playersInRange = []; 

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
		if (isInRange && !wasInRange)
			this.playersInRange.push(player.id);
		if (wasInRange && !isInRange)
			this.playersInRange.splice(playerIndex, 1);
		callback(isInRange, wasInRange);

	}

	removePlayer(id) {
		const playerIndex = this.playersInRange.indexOf(id);
		this.playersInRange.splice(playerIndex, 1);
	}
}

module.exports = Entity;