const socket = io();
const scenes = {
	loading: { sprites: {} },
	splash: { ui: {}, texts: {}, sprites: {} },
	game:  { ui: {}, characters: {}, texts: {}, interactives: {}, scenery: {}, sprites: {} },
	exit: { ui: {}, sprites: {}, texts: {} }
};
const assetsLoaded = { splash: false, map: false, characters: false, stories: false, loading: false };
let currentScene = 'loading';
let characterData, storyData;
let user = {
	interacting: {
		state: false,
		label: 'none',
		type: 'none'
	}
};
const colorPicker = document.getElementById('color-picker');

/* sound */
let theme;
const clips = [];
let prevClip;
let gameSoundOn = false;

function sceneChangeSound() {
	if (gameSoundOn) {
		if (currentScene == 'splash') {
			clips.forEach(clip => clip.pause());
			if (theme.paused) theme.play();
			prevClip = undefined;
		}
	}
}

function toggleSound() {
	/* load audio if not loaded */
	if (!theme) {
		theme = new Audio('/public/audio/theme.mp3');
		theme.volume = 0.5;
		theme.loop = true;
		if (currentScene == 'splash') theme.play();
		for (let i = 0; i < 18; i++) {
			clips.push( new Audio(`/public/audio/clip_${i}.mp3`) );
			clips[i].loop = true;
		}
	} else {
		if (currentScene == 'splash') {
			if (theme.paused) theme.play();
			else theme.pause();
		}
		if (currentScene == 'exit' && gameSoundOn) clips.forEach(clip => clip.pause());
	}
	gameSoundOn = !gameSoundOn;
	prevClip = undefined;
}

function updateAudio(_x, _y) {
	/* play audio in area at 0.5
		audio in prev area, random next area 0.1
		x -22702, y -10788, w 37178, h 24891 */
	const c = 6; // columns
	const r = 3; // rows
	const w = 37178 / 6;
	const h = 24891 / 3;
	let mainClip;
	const adjClips = [];
	for (let x = 0; x < c; x++) {
		for (let y = 0; y < r; y++) {
			if (_x > -22702 + x * w && _x < -22702 + w + x * w &&
				_y > -10788 + y * h && _y < -10788 + h + y * h) {
				mainClip = x + y * c;
				if (prevClip) adjClips.push(prevClip);
				if (x > 0 && x < c - 1 && y > 0 && y < r - 1) {
					function rand() { 
						return Cool.random([ mainClip + 1, mainClip - 1, mainClip + c, mainClip - c]);
					}
					let rnd = rand();
					while (rnd == prevClip) {
						rnd = rand();
					}
					adjClips.push(rnd);
				}
			}
		}
	}

	if (mainClip != prevClip) {
		for (let i = 0; i < clips.length; i++) {
			if (adjClips.includes(i)) {
				if (clips[i].paused) clips[i].play();
				if (clips[i].volume != 0.1) clips[i].volume = 0.1;
			} else {
				if (!clips[i].paused) clips[i].pause();
			}
		}
		
		if (mainClip) {
			if (clips[mainClip].paused) clips[mainClip].play();
			if (clips[mainClip].volume != 0.5) clips[mainClip].volume = 0.5;
			prevClip = mainClip;
		}
	}
}

/* weather */
let weatherOn = false;
const currentWeather = new Animation(undefined, true);
currentWeather.randomFrames = true;
currentWeather.prevFrameCheck = true;
const weatherTime = 1000 * 60 * 5;
let weatherInterval, zip; /* check weather updates?  10 mins? */

function toggleWeather() {
	if (weatherOn) {
		weatherOn = false;
		clearInterval(weatherInterval);
	}
	else {
		weatherOn = true;
		checkWeather();
	}
}

function checkWeather() {
	if (!zip) zip = prompt("Enter zip code.");
	const weatherURL = `https://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=915153355d273e3ff9959dd900a3834f`;
	fetch(weatherURL)
		.then(response => { return response.json() })
		.then(data => {
			const weather = data.weather[0].description;
			currentWeather.src = undefined;
			if (weather.includes('rain')) {
				if (weather.includes('light') || weather.includes('drizzle'))
					currentWeather.src = '/public/drawings/weather/rain-light.json';
				else if (weather.includes('heavy') || weather.includes('shower') || weather.includes('extreme'))
					currentWeather.src = '/public/drawings/weather/rain-heavy.json';
				else
					currentWeather.src = '/public/drawings/weather/rain.json';
			} else if (weather.includes('snow')) {
				if (weather.includes('light'))
					currentWeather.src = '/public/drawings/weather/snow-light.json';
				else if (weather.includes('heavy'))
					currentWeather.src = '/public/drawings/weather/snow-heavy.json';
				else
					currentWeather.src = '/public/drawings/weather/snow.json';
			} else if (weather.includes('clouds')) {
				currentWeather.randomFrames = false;
				if (weather.includes('few') || weather.includes('scattered'))
					currentWeather.src = '/public/drawings/weather/clouds-light.json';
				else if (weather.includes('overcast'))
					currentWeather.src = '/public/drawings/weather/clouds-heavy.json';
				else
					currentWeather.src = '/public/drawings/weather/clouds.json';
			} else if (data.wind.speed > 0) {
				currentWeather.randomFrames = false;
				if (data.wind.speed > 7)
					currentWeather.src = '/public/drawings/weather/wind-heavy.json';
				else if (data.wind.speed > 4)
					currentWeather.src = '/public/drawings/weather/wind.json';
				else if (data.wind.speed > 1)
					currentWeather.src = '/public/drawings/weather/wind-light.json';
			} else if (weather.includes('mist')) {
				currentWeather.src = '/public/drawings/weather/mist.json';
			} else if (weather.includes('fog')) {
				currentWeather.src = '/public/drawings/weather/fog.json';
			}
			// currentWeather.src = '/public/drawings/weather/fog.json'
			// currentWeather.randomFrames = false;
			// console.log(currentWeather.src);
			if (currentWeather.src) currentWeather.load(false);
			weatherInterval = setInterval(checkWeather, weatherTime);
		})
		.catch(error => { console.log(error) });
}

function loadUI(data) {
	console.log('%csplash loaded', 'color:white;background:lightblue;');

	Game.letters = new Animation("/public/drawings/ui/letters.json");
	Game.letters.load(false);

	const map = { "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7, "i":8, "j":9, "k":10, "l":11, "m":12, "n":13, "o":14, "p":15, "q":16, "r":17, "s":18, "t":19, "u":20, "v":21, "w":22, "x":23, "y":24, "z":25, "0":26, "1":27, "2":28, "3":29, "4":30, "5":31, "6":32, "7":33, "8":34, "9":35, ".":36, ",":37, ":":38, "?":39, "E":40, "F":41, "A":42, "S":43, "D":44, "W":45, "{" :46, "}": 47, "-": 48, "+": 49, "M": 50, "J": 51, "K": 52, "L": 53, "Q": 54, "'": 55 };

	for (const key in map) {
		Game.letters.createNewState(key, map[key], map[key]);
	}

	for (const key in data.sprites) {
		const s = data.sprites[key];
		const sprite = new Sprite(s.x >= 0 ? s.x : Game.width + s.x, s.y >= 0 ? s.y : Game.height + s.y);
		sprite.alive = s.alive;
		sprite.addAnimation(s.src);
		for (let i = 0; i < s.scenes.length; i++) {
			scenes[s.scenes[i]].sprites[key] = sprite;
		}
	}

	for (const key in data.uis) {
		const u = data.uis[key];
		const ui = new UI(u, false);
		if (u.callback) {
			ui.callback = function() {
				socket.emit(u.callback.route, u.callback.message);
			};
		}
		if (u.key) {
			document.addEventListener('keydown', function(ev) {
				if (Cool.keys[ev.which] == u.key && u.scenes.includes(currentScene)) {
					if (ui.callback) ui.callback();
				}
			});
		}
		for (let i = 0; i < u.scenes.length; i++) {
			scenes[u.scenes[i]].ui[key] = ui;
		}
	}

	for (const key in data.toggles) {
		const toggle = new Toggle(data.toggles[key]);
		for (let i = 0; i < data.toggles[key].scenes.length; i++) {
			scenes[data.toggles[key].scenes[i]].ui[key] = toggle;
		}
	}

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
		const text = new Text(t.x >= 0 ? t.x : Game.width + t.x, t.y >= 0 ? t.y : Game.height + t.y, t.msg, t.wrap, Game.letters);
		for (let i = 0; i < t.scenes.length; i++) {
			scenes[t.scenes[i]].texts[key] = text;
		}
	}

	socket.emit('splash loaded');
	assetsLoaded.splash = true;
}

function loadMap(data) {
	console.log('%cmap loaded', 'color:white;background:pink;');
	for (const label in data.interactives) {
		setTimeout(() => {
			scenes.game.interactives[label] = new Interactive(data.interactives[label], false, false);
		}, 1);
	}

	for (const type in data.pickups) {
		const group = data.pickups[type];
		const items = data.pickups[type].items;
		for (const label in items) {
			const pickup = items[label];
			setTimeout(() => {
				let states = {}; 
				let s = pickup.states || group.states;
				for (const state in group['state_index']) {
					states[state] = { 
						start: s[group['state_index'][state].start],
						end: s[group['state_index'][state].end],
					};
				}
				scenes.game.interactives[label] = new Interactive(
					{ ...pickup, wrap: data.pickups[type].wrap, states: states, off: group.off  }, 
					true, false);
			}, 1);
		}
	}

	for (const s in data.scenery) {
		const set = data.scenery[s];
		scenes.game.scenery[s] = [];
		for (let i = 0; i < set.length; i++) {
			setTimeout(() => {
				scenes.game.scenery[s].push(new Item(set[i], `/public/drawings/scenery/${s}/${set[i].src}`, false));
			}, 1);
		}
	}

	for (const t in data.textures) {
		if (!scenes.game.scenery[t]) scenes.game.scenery[t] = [];
		const texture = data.textures[t];
		for (let j = 0; j < texture.length; j++) {
			const set = texture[j];
			for (let i = 0; i < set.position.length; i++) {
				const item = new Item(set.position[i],`/public/drawings/scenery/${t}/${set.src}`, false);
				scenes.game.scenery[t].push(item);
				if (set.tags.includes("r")) item.animation.randomFrames = true;
				if (set.tags.includes("i")) item.animation.createNewState("still", i, i);
			}
		}
	}

	assetsLoaded.map = true;
}

function start() {

	scenes.loading.sprites.loading = new Sprite(window.innerWidth/2, window.innerHeight/2);
	scenes.loading.sprites.welcome = new Sprite(window.innerWidth/2, window.innerHeight/2 - 100);
	scenes.loading.sprites.loading.addAnimation('/public/drawings/ui/loading.json', () => {
		scenes.loading.sprites.loading.center();
		scenes.loading.sprites.loading.animation.playOnce(() => {
			scenes.loading.sprites.loading.animation.onPlayedState = undefined;
			scenes.loading.sprites.loading.animation.stop();
			scenes.loading.sprites.welcome.addAnimation('/public/drawings/ui/welcome.json', () => {
				scenes.loading.sprites.welcome.center();
				scenes.loading.sprites.welcome.animation.playOnce(() => {
					assetsLoaded.loading = true;
				});
			});
		});
	});
	// assetsLoaded.loading = true; // remove to play full loading anim


	fetch('/public/data/ui.json')
		.then(response =>  { return response.json() })
		.then(json => loadUI(json));

	fetch('/public/data/map.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));

	fetch('/public/data/character.json')
		.then(response => { return response.json() })
		.then(json => {
			console.log('%ccharacters loaded', 'color:white;background:lightgreen;');
			characterData = json;
			assetsLoaded.characters = true;
		});

	fetch('/public/data/script.json')
		.then(response => { return response.json() })
		.then(json => {
			console.log('%cstories loaded', 'color:white;background:gold;');
			storyData = json;
			assetsLoaded.stories = true;
		});
}

function draw() {
	if (currentScene == 'loading') {
		if (assetsLoaded.splash && assetsLoaded.map && assetsLoaded.characters && assetsLoaded.stories && assetsLoaded.loading) {
			currentScene = 'splash';
			colorPicker.style.display = 'block';
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
		for (const character in scenes.game.characters) {
			scenes.game.characters[character].display();
		}
		for (const interactive in scenes.game.interactives) {
			scenes.game.interactives[interactive].display();
		}
		for (const label in scenes[currentScene].scenery) {
			const set = scenes.game.scenery[label];
			for (let i = 0; i < set.length; i++) {
				set[i].display();
			}
		}

		if (weatherOn) {
			for (let x = 0; x <= Game.width; x += 512) {
				for (let y = 0; y <= Game.height; y += 512) {
					currentWeather.draw(x, y);
					// currentWeather.random();
					// currentWeather.updateFrame();
				}
			}
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

		case 'x':
		case 'enter':
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
	let pointer = false;
	for (const ui in scenes[currentScene].ui) {
		if (scenes[currentScene].ui[ui].over(x, y)) {
			pointer = true;
		}
	}
	if (pointer) document.body.style.cursor = 'pointer';
	else document.body.style.cursor = 'default';
	/* make this part of library ? */
}

function mouseDown(x, y) {
	for (const ui in scenes[currentScene].ui) {
		scenes[currentScene].ui[ui].down(x, y);
	}
}

function mouseUp(x, y) {
	for (const ui in scenes[currentScene].ui) {
		if (scenes[currentScene].ui[ui].up(x, y)) return;
	}
}

/* init game last bc it calls the start function .... better way to do this?
	just no start function? */
Game.init({
	width: window.innerWidth, 
	height: window.innerHeight, 
	lps: 10, 
	stats: false,
	debug: false,
	mixedColors: false
});

/* color selectors */
document.getElementById('line-color').addEventListener('change', ev => {
	Game.ctx.strokeStyle = ev.currentTarget.value;
});

document.getElementById('bg-color').addEventListener('change', ev => {
	Game.canvas.style.backgroundColor = ev.currentTarget.value;
});

socket.emit('set bounds', window.innerWidth/2, window.innerHeight/2); 
	/* need to account for player width/height*/

/* new user */
socket.on('id', id => {
	user.id = id;
});

/* load init data */
socket.on('init splash', data => {
	for (const id in data.players) {
		const player = data.players[id];
		scenes.game.characters[player.character] = new Character(player, characterData[player.character], false, false);
		scenes.splash.ui[player.character].toggle(true);
	}
});

socket.on('join game', data => {
	for (const label in data.interactives) {
		if (data.interactives[label].picked)
			scenes.game.interactives[label].animation.setState('end');
	}
	currentScene = 'game';
	if (theme) if (!theme.paused) theme.pause();
	colorPicker.style.display = 'none';
	initGameSockets();
});

/* hide/show available characters */
socket.on('character selected', (character, state) => {
	scenes.splash.ui[character].toggle(state);
});

/* add character to scene, both user and others */
socket.on('add character', player => {
	scenes.game.characters[player.character] = new Character(player, characterData[player.character], player.id == user.id, false); 
});

socket.on('remove character', character => {
	scenes.splash.ui[character].toggle(false);
	delete scenes.game.characters[character];
});

socket.on('change scene', scene => {
	delete scenes[currentScene].texts.msg;
	currentScene = scene;
	colorPicker.style.display = currentScene == 'splash' ? 'block' : 'none';
	sceneChangeSound();
});

/* recieve player position from server 
	does this go in initGameSockets ? */
socket.on('update', data => {
	if (currentScene == 'game') {
		const offset = {
			x: Game.width/2 - data.players[user.id].x,
			y: Game.height/2 - data.players[user.id].y
		};
		for (const id in data.players) {
			const player = data.players[id];
			if (!scenes.game.characters[player.character].isInteracting) {
				// test to see if they are interacting and then set to true
				// console.log(player.animationState);
				scenes.game.characters[player.character].animation.setState(player.animationState);
			}

			/* move non character players */
			if (id != user.id) {
				if (scenes.game.characters[player.character]) {
					scenes.game.characters[player.character].position.x = player.x;
					scenes.game.characters[player.character].position.y = player.y;
					scenes.game.characters[player.character].position.add(offset);
					scenes.game.characters[player.character].center();
				}

				/* player waving */
				if (player.waving && !scenes.game.characters[player.character].isOnscreen()) {
					const wave = player.character + '-wave';
					const pos = new Cool.Vector( Game.width/2, Game.height/2 );
					pos.subtract(scenes.game.characters[player.character].position);
					pos.multiply(-1);
					pos.normalize();
					pos.multiply( Math.abs(pos.x) > Math.abs(pos.y) ? Game.width/2 - 50 : Game.height/2 - 50  );
					pos.add({x: Game.width/2, y: Game.height/2 });
					scenes.game.sprites[wave].position = pos;
					scenes.game.sprites[wave].alive = true;
					scenes.game.sprites[wave].animation.playOnce(() => {
						scenes.game.sprites[wave].alive = false;
					});
				}
			}
		}
		for (const interactive in scenes[currentScene].interactives) {
			scenes[currentScene].interactives[interactive].update(offset);
		}
		for (let i = 0; i < scenes[currentScene].scenery.length; i++) {
			scenes[currentScene].scenery[i].update(offset);
		}
		for (const label in scenes[currentScene].scenery) {
			const set = scenes.game.scenery[label];
			for (let i = 0; i < set.length; i++) {
				set[i].update(offset);
			}
		}
		if (gameSoundOn) updateAudio(data.players[user.id].x, data.players[user.id].y);
	}
});

/* things not handlged in update ... */
function playInteractiveAnimation(label) {
	if (currentScene == 'game') {/* necessary if? */
		scenes[currentScene].interactives[label].playInteractState(() => {
			socket.emit('interact animation end', label);
		});
	}
}

function displayItemMessage(label, index) {
	if (currentScene == 'game') {
		if (index !== undefined) scenes.game.scenery[label][index].displayMessage(true, false);
		else scenes.game.interactives[label].displayMessage(true, true);
	}
}

function hideItemMessage(label, index) {
	if (currentScene == 'game')
		scenes.game.scenery[label][index].displayMessage(false, false);
}

function playCharacterAnimation(character, type) {
	console.log(character, type);
	scenes.game.characters[character].playAnimation(type);
}

function updateResources(player) {
	scenes.game.characters[player.character].resources = player.resources;
}

function returnResource(resource) {
	scenes.game.interactives[resource].return();
}

function startStory(story) {
	function playNextStory(i) {
		scenes.game.characters[story[i].character].playStory(storyData[story[i].character][storyData.order[i]][story[i].dialog].toLowerCase(), () => {
			i++;
			if (i < 8) {
				playNextStory(i);
			} else {
				socket.emit('done talking');
			}
		});
	}
	playNextStory(0);
}

function endStory(character) {
	scenes.game.characters[character].endStory();
}

/* prevent these updates during loading.... */
function initGameSockets() {
	socket.on('play interact animation', playInteractiveAnimation);
	socket.on('display item message', displayItemMessage);
	socket.on('hide item message', hideItemMessage);
	socket.on('play character animation', playCharacterAnimation);
	socket.on('update resources', updateResources);
	socket.on('return resource', returnResource);
	socket.on('start story', startStory);
	socket.on('end story', endStory);
}

socket.on('msg', msg => {
	scenes[currentScene].texts['msg'] = new Text(10, Game.height - 50, msg, 20, Game.letters);
});

socket.on('disconnect', () => {
	console.log('goodbye');
	socket.disconnect(); /* fuck me  */
	setTimeout(location.reload.bind(location), 1); // can be longer for debugging
});

/* debug messages */
socket.on('get-eval', msg => {
	console.log(msg);
});

function servLog(statement) {
	socket.emit('send-eval', statement);
}