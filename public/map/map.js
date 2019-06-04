const map = { interactives: {}, pickups: {}, scenery: {} };
Game.map = true;
const m = {
	display: false,
	x: 0,
	y: 0,
	w: 0,
	h: 0
}

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

	const scenes = ['spine', 'south-beach', 'river', 'south-arm', 'east-shore', 'north-beach', 'north-arm', 'south-arm', 'north-leg', 'south-leg', 'graveyard', 'grave-fence', 'stones', 'fish'];

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
	const textures = ['grass', 'sand']
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
	fetch('/public/data/map.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));

	offset.px = Game.canvas.width/2;
	offset.py = Game.canvas.height/2;
}

function update() { /* for stats */}

function draw() {
	/* clear  */
	const p1 = Game.ctx.transformedPoint(0,0);
	const p2 = Game.ctx.transformedPoint(Game.canvas.width, Game.canvas.height);
	Game.ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

	Game.ctx.strokeStyle = '#bb11ff';
	Game.ctx.lineWidth = 10;
	Game.ctx.strokeRect(-22702, -10788, 37178, 24891);
	Game.ctx.lineWidth = 1;

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
	const p = Game.ctx.transformedPoint(x, y);
	console.log(`"x": ${Math.floor(p.x)}, "y": ${Math.floor(p.y)}`);
	
	/* copy to clipboard */
	const el = document.createElement('textarea');
	el.value = `"x": ${Math.floor(p.x)}, "y": ${Math.floor(p.y)}`;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
}

const offset = {
	px: 0,
	py: 0,
	dragged: false,
	dragStart: null
}

function mouseMoved(x, y, button) {
	if (button == 1) {
		offset.px = x;
		offset.py = y;
		offset.dragged = true;
		if (offset.dragStart) {
			const pt = Game.ctx.transformedPoint(offset.px, offset.py);
			Game.ctx.translate(pt.x - offset.dragStart.x, pt.y - offset.dragStart.y);
			draw();
		}
	}

	if (button == 3) {
		const p = Game.ctx.transformedPoint(x, y);
		m.w = p.x - m.x;
		m.h = p.y - m.y;
	}
}

function mouseDown(x, y, button) {
	if (button == 1) {
		offset.px = x;
		offset.py = y;
		offset.dragged = false;
		offset.dragStart = Game.ctx.transformedPoint(offset.px, offset.py);
	}
	if (button == 3) {
		const p = Game.ctx.transformedPoint(x, y);
		m.x = p.x;
		m.y = p.y;
		m.display = true;
	}
}

function mouseUp(x, y, button) {
	if (button == 1) offset.dragStart = null;
	if (button == 3) m.display = false;
}

Game.init({width: window.innerWidth, height: window.innerHeight, lps: 10, debug: false});
document.oncontextmenu = function() { return false; }

trackTransforms(Game.ctx);
const scaleFactor = 1.05;
function zoom(clicks) {
	const pt = Game.ctx.transformedPoint(offset.px, offset.py);
	Game.ctx.translate(pt.x, pt.y);
	const factor = Math.pow(scaleFactor, clicks);
	Game.ctx.scale(factor, factor);
	Game.ctx.translate(-pt.x, -pt.y);
	Game.ctx.miterLimit = 1;
	draw();
}

function handleWheel(ev) {
	const delta = ev.wheelDelta ? ev.wheelDelta/40 : ev.detail ? -ev.detail : 0;
	if (delta) zoom(delta);
	return ev.preventDefault() && false;
}

function trackTransforms(ctx) {
	var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
	var xform = svg.createSVGMatrix();
	ctx.getTransform = function(){ return xform; };

	var savedTransforms = [];
	var save = ctx.save;
	ctx.save = function(){
		savedTransforms.push(xform.translate(0,0));
		return save.call(ctx);
	};
	var restore = ctx.restore;
	ctx.restore = function(){
		xform = savedTransforms.pop();
		return restore.call(ctx);
	};

	var scale = ctx.scale;
	ctx.scale = function(sx,sy){
		xform = xform.scaleNonUniform(sx,sy);
		return scale.call(ctx,sx,sy);
	};
	var rotate = ctx.rotate;
	ctx.rotate = function(radians){
		xform = xform.rotate(radians*180/Math.PI);
		return rotate.call(ctx,radians);
	};
	var translate = ctx.translate;
	ctx.translate = function(dx,dy){
		xform = xform.translate(dx,dy);
		return translate.call(ctx,dx,dy);
	};
	var transform = ctx.transform;
	ctx.transform = function(a,b,c,d,e,f){
		var m2 = svg.createSVGMatrix();
		m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
		xform = xform.multiply(m2);
		return transform.call(ctx,a,b,c,d,e,f);
	};
	var setTransform = ctx.setTransform;
	ctx.setTransform = function(a,b,c,d,e,f){
		xform.a = a;
		xform.b = b;
		xform.c = c;
		xform.d = d;
		xform.e = e;
		xform.f = f;
		return setTransform.call(ctx,a,b,c,d,e,f);
	};
	var pt  = svg.createSVGPoint();
	ctx.transformedPoint = function(x,y){
		pt.x=x; pt.y=y;
		return pt.matrixTransform(xform.inverse());
	}
}

Game.canvas.addEventListener("mousewheel", handleWheel, false);

/* view-source:http://phrogz.net/tmp/canvas_zoom_to_cursor.html */