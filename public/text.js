
const map = { "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7, "i":8, "j":9, "k":10, "l":11, "m":12, "n":13, "o":14, "p":15, "q":16, "r":17, "s":18, "t":19, "u":20, "v":21, "w":22, "x":23, "y":24, "z":25, "0":26, "1":27, "2":28, "3":29, "4":30, "5":31, "6":32, "7":33, "8":34, "9":35, ".":36, ",":37, ":":38, "?":39, "_e":40, "_f":41, "_a":42, "_s":43, "_d":44, "_w":45, "_left":46, "_right":47, "_up":48, "_down":49, "_m":50 }

class Text {
	constructor(x, y, msg, wrap) {
		this.x = x;
		this.y = y;
		this.msg = msg;
		this.wrap = wrap;
		this.active = true;
	}
	display() {
		if (this.active) {
			let _x = this.x;
			let _y = this.y;
			for (let i = 0; i < this.msg.length; i++) {
				var letter = this.msg[i];
				if (letter == ' ') {
					_x += 30;
				} else {
					Game.letters.setNewState(letter, map[letter], map[letter]);
					Game.letters.draw(_x, _y);
					_x += 18;
				}
				if (i != 0 && i % this.wrap == 0) {
					_y += 35;
					_x = this.x;
				}
			}
		}
	}
}

