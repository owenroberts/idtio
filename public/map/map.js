const map = {
	interactives: {},
	pickups: {},
	scenery: []
};
Game.map = true;

function loadMap(data) {
	for (let i = 0; i < data.interactives.length; i++) {
		map.interactives[data.interactives[i].label] = new Interactive(data.interactives[i], false);
	}

	for (let i = 0; i < data.pickups.length; i++) {
		map.interactives[data.pickups[i].label] = new Interactive(data.pickups[i], false);
	}

	for (let i = 0; i < data.scenery.length; i++) {
		map.scenery.push( new Item(data.scenery[i], false) );
	}
}

function start() {
	fetch('/public/data/map-data.json')
		.then(response =>  { return response.json() })
		.then(json => loadMap(json));

	offset.px = Game.canvas.width/2;
	offset.py = Game.canvas.height/2;
}

function update() {
	for (const interactive in map.interactives) {
		// map.interactives[interactive].update(offset);
	}
	for (let i = 0; i < map.scenery.length; i++) {
		// map.scenery[i].update(offset);
	}
}

function draw() {

	/* clear  */
	const p1 = Game.ctx.transformedPoint(0,0);
	const p2 = Game.ctx.transformedPoint(Game.canvas.width, Game.canvas.height);
	Game.ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

	for (const interactive in map.interactives) {
		map.interactives[interactive].display();
	}
	for (let i = 0; i < map.scenery.length; i++) {
		map.scenery[i].display();
	}
}

function mouseClicked(x, y) {
	console.log('"x":'+x+', "y":'+y);
}

const offset = {
	px: 0,
	py: 0,
	dragged: false,
	dragStart: null
}

function mouseMoved(x, y) {
	offset.px = x;
	offset.py = y;
	offset.dragged = true;
	if (offset.dragStart) {
		const pt = Game.ctx.transformedPoint(offset.px, offset.py);
		Game.ctx.translate(pt.x - offset.dragStart.x, pt.y - offset.dragStart.y);
		draw();
	}
}

function mouseDown(x, y) {
	offset.px = x;
	offset.py = y;
	offset.dragged = false;
	offset.dragStart = Game.ctx.transformedPoint(offset.px, offset.py);
}

function mouseUp(x, y) {
	offset.dragStart = null;
}

Game.init(window.innerWidth, window.innerHeight, 10, false);

trackTransforms(Game.ctx);
const scaleFactor = 1.05;
function zoom(clicks) {
	const pt = Game.ctx.transformedPoint(offset.px, offset.py);
	Game.ctx.translate(pt.x,pt.y);
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