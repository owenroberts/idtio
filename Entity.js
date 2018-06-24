class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.msg = params.msg;
		this.label = params.label;
		this.playersInRange = []; 
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

/* this shouldn't exist for one value also in super class 
	leave for now if there's other stuff to add */
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