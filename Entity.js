class Entity {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.distance = params.distance;
		this.msg = params.msg;
		this.label = params.label;
		this.players = []; // player is currently in range
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
}
module.exports = Entity;