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
const scenes = {
	splash: { ui: {}, texts: {} },
	game:  { ui: {}, characters: {}, texts: {}, interactives: {}, scenery: [] }
};
let currentScene = 'splash';
let userId;
let updateInterval;
let userInteracting = {
	type: 'none',
	label: 'none'
};

function loadSplashScene() {
	const joinGame = new UI(Game.width/2, Game.height/2, '/public/drawings/ui/join_game.json');
	joinGame.callback = function() {
		socket.emit('join');
	};
	const scratchUI = new UI(120, 250, '/public/drawings/ui/scratch_ui.json');
	scratchUI.sprite.animation.states = {
		idle: { start: 0, end: 2 + 1 },
		over: { start: 3, end: 5 + 1 },
		selected: { start: 3, end: 5 + 1 },
		active: { start: 6, end: 8 + 1 }
	}
	scratchUI.callback = function() {
		socket.emit('character selection', 'scratch');
	};
	const catUI = new UI(300, 250, '/public/drawings/ui/cat_ui.json');
	catUI.sprite.animation.states = {
		idle: { start: 0, end: 0 + 1 },
		over: { start: 1, end: 1 + 1 },
		selected: { start: 1, end: 1 + 1 },
		active: { start: 2, end: 2 + 1 }
	}
	catUI.callback = function() {
		socket.emit('character selection', 'cat');
	};

	scenes.splash.ui['join'] = joinGame;
	scenes.splash.ui['scratch'] = scratchUI;
	scenes.splash.ui['cat'] = catUI;

	Game.letters = new Animation('/public/drawings/ui/letters.json');
	Game.letters.load(true);

	const choose = new Text(10, 10, "choose a character:", 20);
	scenes.splash.texts['choose'] = choose;
}

function loadMap(data) {
	for (let i = 0; i < data.interactives.length; i++) {
		const item = data.interactives[i];
		const interactive = new Interactive(item, false);
		scenes.game.interactives[item.label] = interactive;
	}

	for (let i = 0; i < data.scenery.length; i++) {
		const item = data.scenery[i];		
		const interactive = new Item(item, false);
		scenes.game.scenery.push(interactive);
	}
}

function start() {
	loadSplashScene();
	fetch('/public/map-data.json')
		.then(response =>  { return response.json()})
		.then(json => loadMap(json));
}

function draw() {

	for (const ui in scenes[currentScene].ui) {
		scenes[currentScene].ui[ui].display();
	}

	for (const text in scenes[currentScene].texts) {
		scenes[currentScene].texts[text].display();
	}

	if (currentScene == 'game') {
		for (const character in scenes[currentScene].characters) {
			scenes[currentScene].characters[character].display();
		}
		for (const interactive in scenes[currentScene].interactives) {
			scenes[currentScene].interactives[interactive].display();
		}
		for (let i = 0; i < scenes[currentScene].scenery.length; i++) {
			scenes[currentScene].scenery[i].display();
		}
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
		case 'left':
			socket.emit('key', { input:'left', state: true} );
			break;
		case 'w':
		case 'up':
			socket.emit('key', { input:'up', state: true} );
			break;
		case 'd':
		case 'right':
			socket.emit('key', { input:'right', state: true} );
			break;
		case 's':
		case 'down':
			socket.emit('key', { input:'down', state: true} );
			break;

		case 'e':
			if (userInteracting.type == 'interactive') {
				scenes[currentScene].interactives[userInteracting.label].playInteractState();
			}
			break;
	}
}

function keyUp(key) {
	switch (key) {
		case 'a':
		case 'left':
			socket.emit('key', {input:'left', state: false});
			break;
		case 'w':
		case 'up':
			socket.emit('key', {input:'up', state: false});
			break;
		case 'd':
		case 'right':
			socket.emit('key', {input:'right', state: false});
			break;
		case 's':
		case 'down':
			socket.emit('key', {input:'down', state: false});
			break;
	}
}

function mouseClicked(x, y) {
	for (const ui in scenes[currentScene].ui) {
		const sprite = scenes[currentScene].ui[ui];
		sprite.event(x, y);
	}
}

function mouseMoved(x, y) {
	for (const ui in scenes[currentScene].ui) {
		const sprite = scenes[currentScene].ui[ui];
		sprite.over(x, y);
	}
}

function mouseDown(x, y) {
	for (const ui in scenes[currentScene].ui) {
		const sprite = scenes[currentScene].ui[ui];
		sprite.down(x, y);
	}
}

function mouseUp(x, y) {
	for (const ui in scenes[currentScene].ui) {
		const sprite = scenes[currentScene].ui[ui];
		sprite.down(x, y);
	}
}

/* init game last bc it calls the start function .... better way to do this?
	just no start function? */
Game.init(window.innerWidth, window.innerHeight, 10);

/* new user */
socket.on('id', function(id) {
	userId = id;
});

socket.on('character chosen', function(character){
	scenes.splash.ui[character].select();
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
		for (const interactive in scenes[currentScene].interactives) {
			scenes[currentScene].interactives[interactive].update(offset);
		}
		for (let i = 0; i < scenes[currentScene].scenery.length; i++) {
			scenes[currentScene].scenery[i].update(offset);
		}
	}
});

socket.on('interactive text', function(params) {
	if (!scenes.game.interactives[params.label].interacting)
		scenes.game.interactives[params.label].displayText = params.state;
	if (params.state) {
		userInteracting.type = 'interactive';
		userInteracting.label = params.label;
	} else {
		userInteracting.type = 'none';
		userInteracting.label = 'none';
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