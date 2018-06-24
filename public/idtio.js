const socket = io();
const scenes = {
	splash: { ui: {}, texts: {} },
	game:  { ui: {}, characters: {}, texts: {}, interactives: {}, scenery: [] }
};
let currentScene = 'splash';
let characterData;
let updateInterval;
let user = {
	interacting: {
		state: false,
		label: 'none',
		type: 'none'
	}
}

function loadSplashScene(data) {
	for (const key in data) {
		const ui = data[key];
		scenes.splash.ui[key] = new UI(ui, false);
		scenes.splash.ui[key].callback = function() {
			socket.emit(ui.callback.route, ui.callback.message);
		}
	}

	Game.letters = new Animation('/public/drawings/ui/letters.json');
	// Game.letters.debug = true;
	Game.letters.load(false);

	scenes.splash.texts['choose'] = new Text(10, 10, "choose a character:", 19);
}

function loadMap(data) {
	for (let i = 0; i < data.interactives.length; i++) {
		scenes.game.interactives[data.interactives[i].label] = new Interactive(data.interactives[i], false);
	}

	for (let i = 0; i < data.pickups.length; i++) {
		scenes.game.interactives[data.pickups[i].label] = new Interactive(data.pickups[i], false);
		scenes.game.interactives[data.pickups[i].label].isPickup = true;
	}

	for (let i = 0; i < data.scenery.length; i++) {
		scenes.game.scenery.push( new Item(data.scenery[i], false) );
	}
}

function start() {
	loadSplashScene();

	fetch('/public/ui-data.json')
		.then(response =>  { return response.json() })
		.then(json => loadSplashScene(json));

	fetch('/public/map-data.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));

	fetch('/public/character-data.json')
		.then(response => { return response.json() })
		.then(json => {
			characterData = json;
		});
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
			socket.emit('key', { input: 'interact', state: true} );
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
		case 'e':
			socket.emit('key', { input: 'interact', state: false} );
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
socket.on('id', (id) => {
	user.id = id;
});

socket.on('character chosen', (character) => {
	scenes.splash.ui[character].select();
});

/* add character to scene, both user and others */
socket.on('add character', (player) => {
	const char = new Sprite(player.x, player.y);
	// char.debug = true;
	if (player.id = user.id) {
		char.position.x = Game.width/2;
		char.position.y = Game.height/2;
	}
	char.addAnimation(characterData[player.character].walk.src, () => {
		if (player.id = user.id) 
			char.center();
	});
	char.animation.states = characterData[player.character].walk.states;
	char.animation.state = 'idle';
	scenes.game.characters[player.character] = char;
});

socket.on('remove character', (character) => {
	delete scenes.game.characters[character];
});

socket.on('join game', function() {
	currentScene = 'game';
});

/* recieve player position from server */
socket.on('update', (data) => {
	if (currentScene == 'game') {
		const offset = {
			x: Game.width/2 - data.players[user.id].x,
			y: Game.height/2 - data.players[user.id].y
		}
		for (const id in data.players) {
			const player = data.players[id];
				
			if (!scenes.game.characters[player.character].isInteracting)
				scenes.game.characters[player.character].animation.setState(player.animationState);

			/* move non character players */
			if (id != user.id) {
				if (scenes.game.characters[player.character]) {
					scenes.game.characters[player.character].position.x = player.x;
					scenes.game.characters[player.character].position.y = player.y;
					scenes.game.characters[player.character].position.add(offset);
					scenes.game.characters[player.character].center();
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

socket.on('display interact message', (params) => {
	if (!scenes.game.interactives[params.label].isActive)
		scenes.game.interactives[params.label].displayText = params.state;
});

socket.on('play interact animation', (label) => {
	scenes[currentScene].interactives[label].playInteractState();
});

socket.on('play character animation', (character, type) => {
	scenes.game.characters[character].isInteracting = true;
	scenes.game.characters[character].animation.setState(type);
	scenes.game.characters[character].animation.playOnce(() => {
		scenes.game.characters[character].animation.setState('idle');
		socket.emit('done interacting');
		scenes.game.characters[character].isInteracting = false;
	});
});

socket.on('msg', (msg) => {
	console.log(msg);
});

socket.on('disconnect', () => {
	console.log('goodbye');
	setTimeout(location.reload.bind(location), 1000);
	clearInterval(updateInterval);
});

/* chat */
const chat = document.getElementById('chat');
const chatInput = document.getElementById('chat-input');

socket.on('get-chat', (msg) => {
	const newChat = document.createElement('div');
	newChat.textContent = msg;
	chat.appendChild(newChat);
	if (chat.children.length > 25) {
		chat.children[1].remove();
	}
});

/* debug messages */
socket.on('get-eval', (msg) => {
	console.log(msg);
});

chatInput.addEventListener('keydown', (ev) => {
	if (ev.which == 13) {
		if (chatInput.value[0] == '/') 
			socket.emit('send-eval', chatInput.value.slice(1));
		else
			socket.emit('send-chat', chatInput.value);
		chatInput.value = '';
	}
});