class Character extends Sprite {
	constructor(params, data, isPlayer, debug) {
		super(params.x, params.y);
		this.debug = debug;

		if (isPlayer) { 
			this.position.x = Game.width / 2;
			this.position.y = Game.height / 2;
		}

		this.addAnimation(data.walk.src, () => {
			if (isPlayer)
				this.center();

			this.animation.states = data.walk.states;
			this.animation.state = 'idle';

			const bubble = new Sprite(this.position.x, this.position.y);
			// bubble.debug = true;
			bubble.addAnimation(data.bubble.src, () => {
				// bubble.center();
				bubble.position.x -= this.width/2;
				bubble.position.y -= this.height/3;
				// bubble.animation.isPlaying = false;
				bubble.animation.loop = false;
			});
			this.interfaceBubble = bubble;
			this.displayInterface = false;
		});
	}

	display() {
		super.display();
		if (this.interfaceBubble && this.displayInterface) {
			this.interfaceBubble.display();
			let i = 0;
			for (const key in Game.icons) {
				let x = 20 + i * 60;
				let y = 20;
				Game.icons[key].animation.draw(
					this.interfaceBubble.position.x + x, 
					this.interfaceBubble.position.y + y
				);
				x += 40;
				y += 100;
				Game.letters.setState(Game.icons[key].key);
				Game.letters.draw(
					this.interfaceBubble.position.x + x, 
					this.interfaceBubble.position.y + y
				);
				i++;
			}
		}
	}
}