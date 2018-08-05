const socket = io();
const scenes = {
	loading: { sprites: {} },
	splash: { ui: {}, texts: {}, sprites: {} },
	instructions: { ui: {}, texts: {}, sprites: {} },
	game:  { ui: {}, characters: {}, texts: {}, interactives: {}, scenery: [] },
	exit: { ui: {}, sprites: {}, texts: {} }
};
const assetsLoaded = {
	splash: false,
	map: false,
	characters: false,
	stories: false,
	loading: false
}
let currentScene = 'loading';
let characterData, storyData;
let user = {
	interacting: {
		state: false,
		label: 'none',
		type: 'none'
	}
}

function loadUI(data) {
	console.log('%c splash loaded', 'color:white;background:lightblue;');

	Game.letters = new Animation("/public/drawings/ui/letters.json");
	// Game.letters.debug = true;
	Game.letters.load(false);

	const map = { "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7, "i":8, "j":9, "k":10, "l":11, "m":12, "n":13, "o":14, "p":15, "q":16, "r":17, "s":18, "t":19, "u":20, "v":21, "w":22, "x":23, "y":24, "z":25, "0":26, "1":27, "2":28, "3":29, "4":30, "5":31, "6":32, "7":33, "8":34, "9":35, ".":36, ",":37, ":":38, "?":39, "E":40, "F":41, "A":42, "S":43, "D":44, "W":45, "{" :46, "}": 47, "-": 48, "+": 49, "M": 50, "J": 51, "K": 52, "L": 53, "Q": 54 }

	for (const key in map) {
		Game.letters.createNewState(key, map[key], map[key]);
	}

	for (const key in data.sprites) {
		const s = data.sprites[key];
		const sprite = new Sprite(s.x, s.y);
		sprite.addAnimation(s.src, () => {
			// sprite.center();
		});
		for (let i = 0; i < s.scenes.length; i++) {
			scenes[s.scenes[i]].sprites[key] = sprite;
		}
	}

	for (const key in data.uis) {
		const u = data.uis[key];
		const ui = new UI(u, false);
		ui.callback = function() {
			socket.emit(u.callback.route, u.callback.message);
		};
		if (u.key) {
			document.addEventListener('keydown', function(ev) {
				if (Cool.keys[ev.which] == u.key && u.scenes.indexOf(currentScene) != -1) {
					ui.callback();
				}
			});
		}
		for (let i = 0; i < u.scenes.length; i++) {
			scenes[u.scenes[i]].ui[key] = ui;
		}
	}

	Game.icons = {
		flower: {
			animation: new Animation("/public/drawings/ui/icon-flower.json", true),
			key: "J"
		},
		skull: {
			animation: new Animation("/public/drawings/ui/icon-skull.json", false),
			key: "K"
		},
		apple: {
			animation: new Animation("/public/drawings/ui/icon-heart.json", false),
			key: "L"
		}
	};

	for (const i in Game.icons) {
		Game.icons[i].animation.load(false);
		Game.icons[i].animation.states = {
			"idle": { start: 0, end: 0 },
			"over": { start: 1, end: 1 },
			"select": { start: 2, end: 2 },
			"unavailable": { start: 3, end: 3 },
		}
		Game.icons[i].animation.state = "idle";
	}

	for (const key in data.texts) {
		const t = data.texts[key];
		const text = new Text(t.x, t.y, t.msg, t.wrap, Game.letters);
		for (let i = 0; i < t.scenes.length; i++) {
			scenes[t.scenes[i]].texts[key] = text;
		}
	}

	socket.emit('splash loaded');

	assetsLoaded.splash = true;
}

function loadMap(data) {
	console.log('%c map loaded', 'color:white;background:pink;');
	for (let i = 0; i < data.interactives.length; i++) {
		setTimeout(() => {
			scenes.game.interactives[data.interactives[i].label] = new Interactive(data.interactives[i], false);
		}, 1);
	}

	for (let i = 0; i < data.pickups.length; i++) {
		setTimeout(() => {
			scenes.game.interactives[data.pickups[i].label] = new Interactive(data.pickups[i], false);
			scenes.game.interactives[data.pickups[i].label].isPickup = true;
		}, 1);
	}

	for (let i = 0; i < data.scenery.length; i++) {
		setTimeout(() => {
			scenes.game.scenery.push(new Item(data.scenery[i], false));
		}, 1);
	}
	assetsLoaded.map = true;
}

function start() {

	scenes.loading.sprites.loading = new Sprite(window.innerWidth/2, window.innerHeight/2);
	scenes.loading.sprites.loading.addAnimation('/public/drawings/ui/loading.json', () => {
		scenes.loading.sprites.loading.center();
		scenes.loading.sprites.loading.animation.onPlayedState = function() {
			assetsLoaded.loading = true;
		}
	});


	fetch('/public/data/ui-data.json')
		.then(response =>  { return response.json() })
		.then(json => loadUI(json));

	fetch('/public/data/map-data.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));

	fetch('/public/data/character-data.json')
		.then(response => { return response.json() })
		.then(json => {
			console.log('%c characters loaded', 'color:white;background:lightgreen;');
			characterData = json;
			assetsLoaded.characters = true;
		});

	fetch('/public/data/story-data.json')
		.then(response => { return response.json() })
		.then(json => {
			console.log('%c stories loaded', 'color:white;background:gold;');
			storyData = json;
			assetsLoaded.stories = true;
		});
}

function draw() {

	if (currentScene == 'loading') {
		if (assetsLoaded.splash && assetsLoaded.map && assetsLoaded.characters && assetsLoaded.stories && assetsLoaded.loading) {
			currentScene = 'splash';
		}
	}

	for (const sprite in scenes[currentScene].sprites) {
		scenes[currentScene].sprites[sprite].display();
	}

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

function update() { /* for stats */ }

/* events */
function keyDown(key) {
	switch (key) {
		case 'a':
		case 'left':
			socket.emit('key movement', { input:'left', state: true} );
			break;
		case 'w':
		case 'up':
			socket.emit('key movement', { input:'up', state: true} );
			break;
		case 'd':
		case 'right':
			socket.emit('key movement', { input:'right', state: true} );
			break;
		case 's':
		case 'down':
			socket.emit('key movement', { input:'down', state: true} );
			break;

		case 'e':
			socket.emit('key interact', true);
			break;

		case 'q':
			socket.emit('key wave', true);
			break;

	}
}

function keyUp(key) {
	switch (key) {
		case 'a':
		case 'left':
			socket.emit('key movement', {input:'left', state: false});
			break;
		case 'w':
		case 'up':
			socket.emit('key movement', {input:'up', state: false});
			break;
		case 'd':
		case 'right':
			socket.emit('key movement', {input:'right', state: false});
			break;
		case 's':
		case 'down':
			socket.emit('key movement', {input:'down', state: false});
			break;

		case 'e':
			socket.emit('key interact', false);
			break;

		case 'q':
			socket.emit('key wave', false);
			break;

		case 'j':
		case 'k':
		case 'l':
			socket.emit('key choose dialog', key);
			break;
	}
}

function mouseClicked(x, y) {
	for (const ui in scenes[currentScene].ui) {
		const sprite = scenes[currentScene].ui[ui];
		// sprite.event(x, y);
	}
	// console.log('"x": ' + x + ', "y": ' + y); // not the right coords
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
		if (sprite.up(x, y))
			return;
	}

}

/* init game last bc it calls the start function .... better way to do this?
	just no start function? */
Game.init(window.innerWidth, window.innerHeight, 10, false);
socket.emit('set bounds', window.innerWidth/2, window.innerHeight/2); 
	/* need to account for player width/height*/

/* new user */
socket.on('id', (id) => {
	user.id = id;
});

/* load init data */
socket.on('init splash', (data) => {
	for (const id in data.players) {
		const player = data.players[id];
		scenes.game.characters[player.character] = new Character(player, characterData[player.character], false, false); 
	}
});

socket.on('join game', (data) => {
	for (const label in data.interactives) {
		if (data.interactives[label].picked)
			scenes.game.interactives[label].animation.setState('end');
	}
	currentScene = 'game';
	initGameSockets();
});

/* hide/show available characters */
socket.on('character selected', (character, state) => {
	scenes.splash.ui[character].toggle(state);
});

/* add character to scene, both user and others */
socket.on('add character', (player) => {
	var isPlayer = player.id == user.id;
	scenes.game.characters[player.character] = new Character(player, characterData[player.character], isPlayer, false); 
});

socket.on('remove character', (character) => {
	scenes.splash.ui[character].toggle(false);
	delete scenes.game.characters[character];
});

socket.on('change scene', (scene) => {
	delete scenes[currentScene].texts.msg;
	currentScene = scene;
});

/* recieve player position from server 
	does this go in initGameSockets ? */
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
			/* center? */
		}
		for (let i = 0; i < scenes[currentScene].scenery.length; i++) {
			scenes[currentScene].scenery[i].update(offset);
			/* center? */
		}
	}
});

/* prevent these updates during loading.... */
function initGameSockets() {

	/* player interacting with map interactives */
	socket.on('display interact message', (params) => {
		if (!scenes.game.interactives[params.label].isActive)
			scenes.game.interactives[params.label].displayText = params.state;
	});

	socket.on('play interact animation', (label) => {
		if (currentScene == 'game')
			scenes[currentScene].interactives[label].playInteractState();
	});

	socket.on('play character animation', (character, type) => {
		scenes.game.characters[character].isInteracting = true;
		scenes.game.characters[character].animation.setState(type);
		scenes.game.characters[character].animation.playOnce(() => {
			console.log('done waving');
			scenes.game.characters[character].animation.setState('idle');
			socket.emit('done interacting');
			scenes.game.characters[character].isInteracting = false;
		});
	});

	socket.on('update resources', (player) => {
		scenes.game.characters[player.character].resources = player.resources;
	});

	socket.on('return resource', (resource) => {
		scenes.game.interactives[resource].animation.setState('reborn'); // animate back
		scenes.game.interactives[resource].animation.playOnce(() => {
			scenes.game.interactives[resource].animation.setState('idle');
		});
	});

	/* interacting with another player */
	socket.on('character interface', (id, character, state) => {
		if (id == user.id)
			user.interacting.state = state;
		scenes.game.characters[character].toggleInterface(state);
	});

	socket.on('story input', (data) => {
		scenes.game.characters[data.character].setStoryType(data.type);
	});

	socket.on('start story', (data) => {
		const p = data[0].character; // player
		const o = data[1].character; // other
		const pt = data[0].type; // player story type
		const ot = data[1].type; // other story type
		const charKey = storyData[p + '-' + o] ? p + '-' + o : o + '-' + p;
		const charData = storyData[charKey];
		const storyKey = charKey == p + '-' + o ? pt + '-' + ot : ot + '-' + pt;
		const story = charData[storyKey];

		setTimeout(() => {
			scenes.game.characters[p].iconType = false;
			scenes.game.characters[o].iconType = false;
			function playNextStory(index) {
				const char = story[index][0];
				const dialog = story[index][1];
				scenes.game.characters[char].toggleBox(true);
				scenes.game.characters[char].playStory(dialog, () => {
					index++;
					if (index < story.length) {
						scenes.game.characters[char].toggleBox(false);
						playNextStory(index);
					} else {
						socket.emit('done talking');
					}
				});
			}
			playNextStory(0);
		}, 1200);
	});

	socket.on('end story', (character) => {
		scenes.game.characters[character].endStory();
		scenes.game.characters[character].toggleBox(false);
		scenes.game.characters[character].toggleInterface(false);
	});
}

socket.on('msg', (msg) => {
	scenes[currentScene].texts['msg'] = new Text(10, Game.height - 50, msg, 20, Game.letters);
});

socket.on('disconnect', () => {
	console.log('goodbye');
	socket.disconnect(); /* fuck me  */
	setTimeout(location.reload.bind(location), 1); // can be longer for debugging
});

/* chat */
// const chat = document.getElementById('chat');
// const chatInput = document.getElementById('chat-input');

// socket.on('get-chat', (msg) => {
// 	const newChat = document.createElement('div');
// 	newChat.textContent = msg;
// 	chat.appendChild(newChat);
// 	if (chat.children.length > 25) {
// 		chat.children[1].remove();
// 	}
// });

/* debug messages */
socket.on('get-eval', (msg) => {
	console.log(msg);
});

function servLog(statement) {
	socket.emit('send-eval', statement);
}

// chatInput.addEventListener('keydown', (ev) => {
// 	if (ev.which == 13) {
// 		socket.emit('send-eval', chatInput.value);
// 		chatInput.value = '';
// 	}
// 	if (ev.which == 27)
// 		chatInput.blur();
// });