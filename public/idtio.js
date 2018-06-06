const socket = io();
const characterData = {
	scratch: {
		walk: {
			file: '/public/drawings/characters/scratch_walk.json',
			states: {
				idle: { start: 0, end: 3 },
				right: { start: 3, end: 7 },
				left: { start: 7, end: 11 },
				down: { start: 11, end: 13 },
				up: { start: 13, end: 15 }
			}
		}
	},
	cat: {
		walk: {
			file: '/public/drawings/characters/cat_walk.json',
			states: {
				idle: { start: 0, end: 3 + 1 },
				right: { start: 4, end: 7 + 1 },
				left: { start: 8, end: 11 + 1 },
				down: { start: 12, end: 13 + 1 },
				up: { start: 14, end: 15 + 1 }
			}
		}
	}
};
const mapData = {
	interactives: [
		{
			file: '/public/drawings/interactives/palm-0.json',
			x: 100,
			y: 100
		}
	]
};
const scenes = {
	splash: { ui: [], sprites: [], characters: {} },
	game:  { ui: [], characters: {}, interactives: [] }
};
let currentScene = 'splash';
let userId;
let updateInterval;

function loadSplashScene() {
	const joinGame = new UI(Game.width/2, Game.height/2, '/public/drawings/ui/join_game.json');
	joinGame.callback = function() {
		socket.emit('join');
	};
	const scratchUI = new UI(120, 250, '/public/drawings/ui/scratch_ui.json');
	scratchUI.sprite.animation.states = {
		idle: { start: 0, end: 2 + 1 },
		over: { start: 3, end: 5 + 1 },
		active: { start: 6, end: 8 + 1 }
	}
	scratchUI.callback = function() {
		socket.emit('character selection', 'scratch');
	};
	const catUI = new UI(300, 250, '/public/drawings/ui/cat_ui.json');
	catUI.sprite.animation.states = {
		idle: { start: 0, end: 0 + 1 },
		over: { start: 1, end: 1 + 1 },
		active: { start: 2, end: 2 + 1 }
	}
	catUI.callback = function() {
		socket.emit('character selection', 'cat');
	};

	scenes.splash.ui.push(joinGame);
	scenes.splash.ui.push(scratchUI);
	scenes.splash.ui.push(catUI);
}

function loadMap() {
	for (let i = 0; i < mapData.interactives.length; i++) {
		const data = mapData.interactives[i];		
		const interactive = new Sprite(data.x, data.y);
		// interactive.debug = true;
		interactive.addAnimation(data.file, () => {
			interactive.center();
		});
		scenes.game.interactives.push(interactive);
	}
}

function start() {
	loadSplashScene();
}

function draw() {
	scenes[currentScene].ui.forEach(function(ui) {
		ui.display();
	});
	for (const character in scenes[currentScene].characters) {
		const sprite = scenes[currentScene].characters[character];
		sprite.display();
	}
	if (currentScene == 'game') {
		scenes[currentScene].interactives.forEach(function(interactive) {
			interactive.display();
		});
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
			socket.emit('key', {input:'left', state: true});
			break;
		case 'w':
			socket.emit('key', {input:'up', state: true});
			break;
		case 'd':
			socket.emit('key', {input:'right', state: true});
			break;
		case 's':
			socket.emit('key', {input:'down', state: true});
			break;
	}
}

function keyUp(key) {
	switch (key) {
		case 'a':
			socket.emit('key', {input:'left', state: false});
			break;
		case 'w':
			socket.emit('key', {input:'up', state: false});
			break;
		case 'd':
			socket.emit('key', {input:'right', state: false});
			break;
		case 's':
			socket.emit('key', {input:'down', state: false});
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

/* new user */
socket.on('id', function(id) {
	userId = id;
});

/* add character to scene, both user and others */
socket.on('add character', function(player) {
	const char = new Sprite(player.x, player.y);
	if (player.id = userId) {
		char.position.x = Game.width/2;
		char.position.y = Game.height/2;
	}
	char.addAnimation(characterData[player.character].walk.file, () => {
		if (player.id = userId) 
			char.center();
	});
	char.animation.states = characterData[player.character].walk.states;
	char.animation.state = 'idle';
	scenes.game.characters[player.character] = char;
});

socket.on('remove character', function(character) {
	delete scenes.game.characters[character];
});

socket.on('join game', function() {
	currentScene = 'game';
	loadMap();
});

/* recieve player position from server */
socket.on('players', function(players) {
	if (currentScene == 'game') {
		const offset = {
			x: Game.width/2 - players[userId].x,
			y: Game.height/2 - players[userId].y
		}
		for (const id in players) {
			const player = players[id];
			if (player.joinedGame) {
				/* change animation state */
				scenes.game.characters[player.character].animation.state = player.animationState;
				/* move no character players */
				if (id != userId) {
					if (scenes.game.characters[player.character]) {
						scenes.game.characters[player.character].position.x = player.x;
						scenes.game.characters[player.character].position.y = player.y;
						scenes.game.characters[player.character].position.add(offset);
						scenes.game.characters[player.character].center();
					}
				}
			}
		}
		scenes[currentScene].interactives.forEach(function(interactive) {
			// interactive.position.add(offset);
		});
	}
});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.on('disconnect', function() {
	console.log('goodbye');
	setTimeout(location.reload.bind(location), 1000);
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