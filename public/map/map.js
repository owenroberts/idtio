/* trying this zoom: http://www.cs.colostate.edu/~anderson/newsite/javascript-zoom.html*/

const map = { interactives: {}, pickups: {}, scenery: {} };
Game.map = true;
const m = {
	display: false,
	x: 0,
	y: 0,
	w: 0,
	h: 0
};

const zoom = {
	canvas: {
		width: undefined,
		height: undefined
	},
	view: {
		x: 0,
		y: 0,
		width: 1.0,
		height: 1.0,
		original: {
			width: 1.0,
			height: 1.0
		}
	},
	previous: {
		x: undefined,
		y: undefined
	},
	mouseDown: false,

};

window.addEventListener('keydown', ev => {
	if (Cool.keys[ev.which] == 'r') location.reload();
});

function loadMap(data) {

	// for (const label in data.interactives) {
	// 	map.interactives[label] = new Interactive(data.interactives[label], false);
	// }

	// for (const type in data.pickups) {
	// 	const set = data.pickups[type].items;
	// 	for (const label in set) {
	// 		const item = set[label];
	// 		item.state = 'idle';
	// 		item.states = { idle: { start: 0, end: 0 } };
	// 		map.interactives[label] = new Interactive(item, false);
	// 	}
	// }
	// for (const key in data.pickups.flower.items) {
	// 	const item = data.pickups.flower.items[key];
	// 	item.state = 'idle';
	// 	item.states = { idle: { start: 0, end: 0 } };
	// 	// console.log(item.src);
	// 	map.interactives[key] = new Interactive(item, item.src, false);
	// }

	// const scenes = ['south-beach', 'river', 'south-arm', 'east-shore', 'north-beach', 'north-arm', 'south-arm', 'north-leg', 'south-leg', 'spine'];
	const scenes = ['spine'];

	for (const s in data.scenery) {
		if (scenes.includes(s)) {
			const set = data.scenery[s];
			map.scenery[s] = [];
			for (let i = 0; i < set.length; i++) {
				const item = new Item(set[i], `/public/drawings/scenery/${s}/${set[i].src}`, false);
				map.scenery[s].push(item);
				item.label = set[i].src.split('/').pop().split('.')[0];
			}
		}
	}

	/* textures tags r is random, a is animate, i is index */
	const textures = [/*'waves'*/];
	for (const t in data.textures) {
		if (textures.includes(t)) {
			if (!map.scenery[t]) map.scenery[t] = [];
			const texture = data.textures[t];
			for (let j = 0; j < texture.length; j++) {
				const set = texture[j];
				for (let i = 0; i < set.position.length; i++) {
					const item = new Item(set.position[i],`/public/drawings/scenery/${t}/${set.src}`, false);
					map.scenery[t].push(item);
					item.label = set.src.split('/').pop().split('.')[0] + ` ${i} ${set.position[i].x}`;
					if (set.tags.includes("r")) item.animation.randomFrames = true;
					if (set.tags.includes("i")) item.animation.createNewState("still", i, i);
				}
			}
		}
	}
}

function start() {
	zoom.canvas.width = zoom.view.width = Game.width;
	zoom.canvas.height = zoom.view.height = Game.height;
	fetch('/public/data/map.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));
}

function update() { /* for stats */}

function draw() {

	Game.ctx.setTransform(1,0,0,1,0,0);
   	// Game.ctx.scale(zoom.canvas.width / zoom.view.width, zoom.canvas.height / zoom.view.height);
    Game.ctx.translate(-zoom.view.x, -zoom.view.y);

    Game.ctx.clearRect(zoom.view.x, zoom.view.y, zoom.view.width, zoom.view.height);

	Game.ctx.font = '16px monaco';
	Game.ctx.fillStyle = '#bb11ff';
	for (const interactive in map.interactives) {
		Game.ctx.strokeStyle = '#000000';
		map.interactives[interactive].display();
		Game.ctx.fillText(interactive, map.interactives[interactive].position.x, map.interactives[interactive].position.y);
	}

	for (const s in map.scenery) {
		const set = map.scenery[s];
		for (let i = 0; i < set.length; i++) {
			const item = map.scenery[s][i];
			Game.ctx.strokeStyle = '#000000';
			item.display();
			Game.ctx.fillText(`${s} ${item.label}`, item.position.x, item.position.y);
		}
	}

	/* measurement */
	if (m.display) {
		Game.ctx.strokeStyle = '#bb11ff';
		Game.ctx.strokeRect(m.x, m.y, m.w, m.h);
		
		Game.ctx.font = '48px monaco';
		Game.ctx.fillText(Math.floor(m.w), m.x + m.w/2, m.y - 10);
		Game.ctx.fillText(Math.floor(m.h), m.x - 20, m.y + m.h/2);
	}
}

function mouseClicked(x, y) {

	// const p = Game.ctx.transformedPoint(x, y);
	// console.log(`"x": ${Math.floor(p.x)}, "y": ${Math.floor(p.y)}`);
	
	/* copy to clipboard */
	const el = document.createElement('textarea');
	// el.value = `"x": ${Math.floor(p.x)}, "y": ${Math.floor(p.y)}`;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
}

function mouseMoved(x, y, button) {
	
	if (button == 1) {
		if (mouseDown) {
			const dx = (x - zoom.previous.x) / zoom.canvas.width * zoom.view.width;
			const dy = (y - zoom.previous.y) / zoom.canvas.height * zoom.view.height;
			zoom.view.x -= dx;
			zoom.view.y -= dy;
		}
	}
	zoom.previous.x = x;
	zoom.previous.y = y;

	if (button == 3) {
		// const p = Game.ctx.transformedPoint(x, y);
		// m.w = p.x - m.x;
		// m.h = p.y - m.y;
	}
}

function mouseDown(x, y, button) {
	if (button == 1) {
		zoom.mouseDown = true;
		if (!zoom.previous.x) zoom.previous.x = x;
		if (!zoom.previous.y) zoom.previous.y = y;
	}
	if (button == 3) {
		// const p = Game.ctx.transformedPoint(x, y);
		// m.x = p.x;
		// m.y = p.y;
		m.display = true;
	}
}

function mouseUp(x, y, button) {
	if (button == 1) zoom.mouseDown = false;
	if (button == 3) m.display = false;
}

Game.init({ width: window.innerWidth, height: window.innerHeight, lps: 10, debug: false, stats: false });
// Game.clearBg =
document.oncontextmenu = function() { return false; }

function handleWheel(ev) {
	const x = zoom.view.width / 2 + zoom.view.x;  // View coordinates
	const y = zoom.view.height / 2 + zoom.view.y;

	const scale = (event.wheelDelta < 0 || event.detail > 0) ? 1.1 : 0.9;
	zoom.view.width *= scale;
	zoom.view.height *= scale;

	// scale about center of view, rather than mouse position. This is different than dblclick behavior.
	zoom.view.x = x - zoom.view.width / 2;
	zoom.view.y = y - zoom.view.height / 2;

}

Game.canvas.addEventListener("mousewheel", handleWheel, false);

/* view-source:http://phrogz.net/tmp/canvas_zoom_to_cursor.html */

window.addEventListener("beforeunload", function(ev) {
	
});