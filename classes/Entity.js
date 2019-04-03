class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.msg = params.msg;
		this.playersInRange = []; 
	}

	checkInRange(player, callback, debug) {
		const _x = player.x - this.x;
		const _y = player.y - this.y;
		const playerIndex = this.playersInRange.indexOf(player.id);
		const wasInRange = playerIndex != -1;
		const isInRange = Math.sqrt(_x * _x + _y * _y) < this.distance * (wasInRange ? 2 : 1);
		if (isInRange && !wasInRange)
			this.playersInRange.push(player.id);
		if (wasInRange && !isInRange)
			this.playersInRange.splice(playerIndex, 1);
		callback(isInRange, wasInRange);
	}

	removePlayer(id) {
		this.playersInRange.splice(this.playersInRange.indexOf(id), 1);
	}
}

module.exports = Entity;