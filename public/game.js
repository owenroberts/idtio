const socket = io();
/* game graphics stuff */
const scenes = {
	'splash': {
		ui: [],
		sprites: [],
		characters: {}
	},
	'game': {
		ui: [],
		sprites: [],
		characters: {}
	}
};

let currentScene = 'splash';
let userCharacter;
const movement = {
	up: false,
	down: false,
	left: false,
	right: false
}

function UI(x, y, src, debug) {
	this.sprite = new Sprite(x, y);
	this.sprite.debug = debug;
	this.sprite.addAnimation(src, function() {
		this.sprite.center();
	}.bind(this));
	this.sprite.animation.states = {
		idle: { start: 0, end: 0 },
		over: { start: 1, end: 1 },
		active: { start: 2, end: 2 }
	};
	this.sprite.animation.state = 'idle';
	this.display = function() {
		this.sprite.display();
	};
	this.over = function(x, y) {
		if (this.sprite.tap(x,y)) {
			this.sprite.animation.changeState('over');
			document.body.style.cursor = 'pointer';
		} else {
			this.sprite.animation.changeState('idle');
			document.body.style.cursor = 'default';
		}
	}
	this.down = function(x, y) {
		if (this.sprite.tap(x,y)) {
			this.sprite.animation.changeState('active');
			document.body.style.cursor = 'pointer';
		}
	}
	this.up = function(x, y) {
		if (this.sprite.tap(x,y)) {
			this.sprite.animation.changeState('over');
			document.body.style.cursor = 'pointer';
		}
	}
	this.event = function(x, y) {
		if (this.sprite.tap(x, y)) {
			if (this.callback) 
				this.callback();
		}
	}
}

function createCharacter(character) {
	userCharacter = new Sprite(Game.width/2, Game.height/2);
	userCharacter.addAnimation('/public/drawings/ui/scratch_ui.json');
	userCharacter.debug = true;
	scenes.game.characters[character] = userCharacter;
	userCharacter.animation.states = {
		idle: { start: 0, end: 0},
		walk: { start: 1, end: 1}
	};
	userCharacter.animation.state = 'idle';
}

function start() {
	const joinGame = new UI(Game.width/2, Game.height/2, '/public/drawings/ui/join_game.json');
	joinGame.callback = function() {
		socket.emit('scene', 'game');
	};
	const scratchUI = new UI(120, 250, '/public/drawings/ui/scratch_ui.json');
	scratchUI.sprite.animation.states = {
		idle: { start: 0, end: 2 },
		over: { start: 3, end: 5 },
		active: { start: 6, end: 8 }
	}
	scratchUI.callback = function() {
		socket.emit('character selection', 'scratch');
	};
	scenes.splash.ui.push(joinGame);
	scenes.splash.ui.push(scratchUI);
}

function draw() {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.display();
	});
	scenes[currentScene].sprites.forEach(function(sprite) {
		sprite.display();
	});
	for (const character in scenes[currentScene].characters) {
		const sprite = scenes[currentScene].characters[character];
		sprite.display();
	}
}

function update() {
/*	scenes[currentScene].sprites.forEach(function(sprite) {
		sprite.update();
	});*/
}

function keyDown(key) {
	
	switch (key) {
		case 'a':
			movement.left = true;
			break;
		case 'w':
			movement.up = true;
			break;
		case 'd':
			movement.right = true;
			break;
		case 's':
			movement.down = true;
			break;
	}
}

function keyUp(key) {
	switch (key) {
		case 'a':
			movement.left = false;
			break;
		case 'w':
			movement.up = false;
			break;
		case 'd':
			movement.right = false;
			break;
		case 's':
			movement.down = false;
			break;
	}
}

function mouseClicked(x, y) {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.event(x, y);
	});
}

function mouseMoved(x, y) {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.over(x, y);
	});
}

function mouseDown(x, y) {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.down(x, y);
	});
}

function mouseUp(x, y) {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.up(x, y);
	});
}

/* init game last bc it calls the start function .... better way to do this?
	just no start function? */
Game.init(window.innerWidth, window.innerHeight, 10);

/* send data to server */

socket.emit('new', { x: Game.width/2, y: Game.height/2 });

function serverUpdate() {
	socket.emit('update', {
		movement: movement
	});
}

/* recieve data from server */
socket.on('scene', function(scene) {
	console.log(scene);
	currentScene = scene;
});

socket.on('character selection', function(character){
	if (character == 'none') {
		console.log(character);
	} else {
		createCharacter(character);
		setInterval(serverUpdate, 1000 / 60);
	}
});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.on('players', function(players) {
	for (const id in players) {
		const player = players[id];
		scenes.game.characters[player.character].position.x = player.x;
		scenes.game.characters[player.character].position.y = player.y;
	}
});