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

/* user character and info */
let userCharacter;
const movement = {
	up: false,
	down: false,
	left: false,
	right: false
}
let updateInterval;

function start() {
	const joinGame = new UI(Game.width/2, Game.height/2, '/public/drawings/ui/join_game.json');
	joinGame.callback = function() {
		socket.emit('join');
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
	const catUI = new UI(300, 250, '/public/drawings/ui/cat_ui.json');
	catUI.sprite.animation.states = {
		idle: { start: 0, end: 0 },
		over: { start: 1, end: 1 },
		active: { start: 2, end: 2 }
	}
	catUI.callback = function() {
		socket.emit('character selection', 'cat');
	};

	scenes.splash.ui.push(joinGame);
	scenes.splash.ui.push(scratchUI);
	scenes.splash.ui.push(catUI);
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
/* update happens on the server */
function update() {
	// for stats 
}

/* events */
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

/* new user 
	x,y set here for now, not really the best */
socket.emit('new', { x: Game.width/2, y: Game.height/2 });

/* this is the update "loop" sending user input to server */
function serverUpdate() {
	socket.emit('update', {
		movement: movement
	});
}

socket.on('scene', function(scene) {
	currentScene = scene;
})

// receive character selection response from server 
socket.on('character selection', function(character) {
	/* create the character and start updating the game 
		x,y has to match new user x,y */
	userCharacter = new Sprite(Game.width/2, Game.height/2);
	// prob need sprite data object
	userCharacter.addAnimation('/public/drawings/ui/' + character + '_ui.json');
	// userCharacter.debug = true;
	scenes.game.characters[character] = userCharacter;
	userCharacter.animation.states = {
		idle: { start: 0, end: 0},
		walk: { start: 1, end: 1}
	};
	userCharacter.animation.state = 'idle';
	updateInterval = setInterval(serverUpdate, 1000 / 60);
});

/* recieve player position from server */
socket.on('players', function(players) {
	if (currentScene == 'game') {
		for (const id in players) {
			const player = players[id];
			if (scenes.game.characters[player.character]) {
				scenes.game.characters[player.character].position.x = player.x;
				scenes.game.characters[player.character].position.y = player.y;
			} else {
				// if the character isn't in scene, load it
				const newCharacter = new Sprite(player.x, player.y);
				newCharacter.addAnimation('/public/drawings/ui/' + player.character + '_ui.json');
				newCharacter.animation.states = {
					idle: { start: 0, end: 0},
					walk: { start: 1, end: 1}
				};
				newCharacter.animation.state = 'idle';
				scenes.game.characters[player.character] = newCharacter;
			}
		}
	}
});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.on('disconnect', function() {
	console.log('goodbye');
	clearInterval(updateInterval);

});

/* chat */
const chat = document.getElementById('chat');
const chatInput = document.getElementById('chat-input');

socket.on('get-chat', function(msg) {
	const newChat = document.createElement('div');
	newChat.textContent = msg;
	chat.appendChild(newChat);
	if (chat.children.length > 25) {
		chat.children[1].remove();
	}
});

/* debug messages */
socket.on('get-eval', function(msg) {
	console.log(msg);
});

chatInput.addEventListener('keydown', function(ev) {
	if (ev.which == 13) {
		if (chatInput.value[0] == '/') 
			socket.emit('send-eval', chatInput.value.slice(1));
		else
			socket.emit('send-chat', chatInput.value);
		chatInput.value = '';
	}
});