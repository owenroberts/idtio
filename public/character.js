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
		});

		this.interfaceBubble = new Animation(data.bubble.src, false);
		this.interfaceBubble.load(false, () => {
			this.interfaceBubble.loop = false;
			this.interfaceBubble.states = data.bubble.states;
		});

		this.resources = params.resources;
	}

	display() {
		super.display();
		if (this.interfaceBubble && this.displayInterface) {
			let x = this.position.x - this.width / 4;
			let y = this.position.y - this.height / 4;
			this.interfaceBubble.draw(x, y);
			let i = 0;
			x += 20;
			y += 20;
			for (const key in Game.icons) {
				x += 40;
				
				if (this.resources[key].length > 0)
					Game.icons[key].animation.setState('idle')
				else
					Game.icons[key].animation.setState('unavailable')
				Game.icons[key].animation.draw(x, y);
				
				Game.letters.setState(Game.icons[key].key);
				Game.letters.draw(x, y + 100);
				i++;
			}
		}
	}


}