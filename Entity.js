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
		if (wasInRange) {
			if (!isInRange) {
				this.playersInRange.splice(playerIndex, 1);
				callback('exited');
			} else {
				if (player.isInteracting) {
					player.isInteracting = false;
					if (this.isPickup) {
						if (!this.picked) {
							player.resources[this.type].push( this.label );
							this.picked = true;
							callback('picked up');
						}
					} else {
						callback('interacted');
					}
				} else if (player.talking) {
					callback('talking'); /* problem for interactives ? */
				}
			}
		} else {
			if (isInRange) {
				this.playersInRange.push(player.id);
				callback('entered');
			}
		}
	}
}

module.exports = Entity;