/*
 * The mine sweeper game class
 */

// field cell states
const CELL_MARK = -3;
const CELL_FLAG = -2;
const CELL_UNKNOWN = -1;

// difficulty -> mine density
const MINE_DENSITY = {
	0: 1.0 / 8.0,
	1: 1.0 / 6.0,
	2: 1.0 / 4.0,
	3: 1.0 / 2.0,
};

// style definitions, indexed by style id
const STYLES = [
	{
		padding: 8,
		blockMarginRatio: 0.1,
		colorBackground1: "rgba(62, 62, 73, 1.0)",
		colorBackground2: "rgba(127, 127, 152, 1.0)",
		colorArea: "",
		colorAreaStroke: "",
		colorBlockUnknown: "rgba(44, 44, 54, 0.6)",
		colorBlockUnknownStroke: "rgba(44, 44, 54, 0.8)",
		colorBlockDiscovered: "rgba(145, 145, 179, 0.6)",
		colorBlockDiscoveredStroke: "rgba(115, 115, 142, 0.8)",
		colorBlockMistaken: "rgba(255, 0, 0, 0.3)",
		colorBlockMistakenStroke: "rgba(255, 224, 224, 0.6)",
	},
	{
		padding: 8,
		blockMarginRatio: 0.05,
		colorBackground1: "rgb(50, 100, 50)",
		colorBackground2: "rgb(30, 60, 30)",
		colorArea: "",
		colorAreaStroke: "",
		colorBlockUnknown: "rgba(88, 108, 88, 0.8)",
		colorBlockUnknownStroke: "rgba(88, 108, 88, 0.9)",
		colorBlockDiscovered: "rgba(145, 179, 145, 0.8)",
		colorBlockDiscoveredStroke: "rgba(115, 142, 115, 0.9)",
		colorBlockMistaken: "rgba(255, 0, 0, 0.3)",
		colorBlockMistakenStroke: "rgba(255, 224, 224, 0.6)",
	},
	{
		padding: 8,
		blockMarginRatio: 0.1,
		colorBackground1: "rgba(244, 244, 255, 1.0)",
		colorBackground2: "rgba(211, 211, 220, 1.0)",
		colorArea: "",
		colorAreaStroke: "",
		colorBlockUnknown: "rgba(190, 190, 198, 0.6)",
		colorBlockUnknownStroke: "rgba(210, 210, 219, 0.8)",
		colorBlockDiscovered: "rgba(155, 155, 168, 0.6)",
		colorBlockDiscoveredStroke: "rgba(136, 136, 148, 0.8)",
		colorBlockMistaken: "rgba(255, 0, 0, 0.3)",
		colorBlockMistakenStroke: "rgba(255, 224, 224, 0.6)",
	},
];

class Minesweeper {
	constructor() {
		// html elements
		this.canvas = null;
		this.smiley = null;
		this.timeHolder = null;
		this.context = null;

		// game state
		this.isNewGame = false;
		this.isGameOver = false;
		this.isFinished = false;

		// difficulty and score
		this.fieldSize = 10;
		this.gameDifficulty = 1;
		this.score = 0;
		this.flagOnClick = false;
		this.minesDensity = MINE_DENSITY[1];

		// time measurement
		this.startTime = null;
		this.endTime = null;
		this.intervalId = null;

		// 2-dimensional arrays
		// field array stores discovered fields
		// -3 = marker, -2 = bomb flag, -1 = undiscovered
		// 0 = zero mines next to this block, 1 - 8 = number of mines next to the block
		this.field = null;
		this.mines = null;
		this.mistakes = null;

		// style settings and images
		this.style = null;
		this.playArea = null;
		this.blockSize = 0;
		this.blockMargin = 0;
		this.images = {};
		this.imageCounter = [];
		this.loadingImages = 0;
		this.loadingRedraw = false;

		// sounds
		this.sounds = {};
		this.hasSound = false;
		this.mute = false;

		// event callbacks
		this.onGameOver = null;
		this.onFinished = null;
		this.onNewGame = null;
		this.onStartGame = null;

		this.init();
	}

	/*
	 * init function
	 */
	init() {
		if (!document.getElementById) {
			return;
		}

		this.smiley = document.getElementById("mssmiley");
		this.canvas = document.getElementById("mscanvas");
		this.timeHolder = document.getElementById("mstimespan").firstChild;

		if (this.canvas.getContext && this.canvas.addEventListener) {
			this.context = this.canvas.getContext("2d");
			this.canvas.addEventListener("mousedown", (e) => e.preventDefault(), false);
			this.canvas.addEventListener("mouseup", (e) => e.preventDefault(), false);
			this.canvas.addEventListener("click", (e) => {
				this.onClick(e, false);
				e.preventDefault();
			}, false);
			this.canvas.addEventListener("contextmenu", (e) => {
				this.onClick(e, true);
				e.preventDefault();
			}, false);

			// initialize sounds
			this.initSounds();
		}
	}

	initSounds() {
		// check for support
		this.hasSound = true;
		try {
			if (!new Audio().canPlayType) {
				this.hasSound = false;
			}
		} catch (e) {
			this.hasSound = false;
		}

		// activate sound by default
		this.mute = false;

		this.sounds = {};
		this.loadSound("boom");
		this.loadSound("discover");
		this.loadSound("flag");
	}

	/*
	 * Loads a specific sound
	 */
	loadSound(snd) {
		if (!this.hasSound) {
			this.sounds[snd] = null;
			return;
		}

		const audio = new Audio();
		if (audio.canPlayType("audio/ogg").match(/^(maybe|probably)$/i)) {
			audio.src = `sounds/${snd}.ogg`;
		} else if (audio.canPlayType("audio/mp3").match(/^(maybe|probably)$/i)) {
			audio.src = `sounds/${snd}.mp3`;
		} else {
			audio.src = `sounds/${snd}.wav`;
		}

		audio.addEventListener("ended", () => audio.load(), false);
		audio.load();
		this.sounds[snd] = audio;
	}

	/*
	 * Plays a previously loaded sound
	 */
	playSound(snd) {
		const audio = this.sounds[snd];
		if (!this.hasSound || this.mute || audio == null || audio.error) {
			return;
		}

		if (audio.aborted) {
			audio.load();
		} else if (audio.currentTime > 0) {
			audio.load();
		}
		audio.play();
	}

	/*
	 * starts a new game
	 */
	newGame() {
		// create arrays
		this.field = new Array(this.fieldSize);
		this.mines = new Array(this.fieldSize);
		this.mistakes = new Array(this.fieldSize);

		for (let x = 0; x < this.fieldSize; x++) {
			this.field[x] = new Array(this.fieldSize);
			this.mines[x] = new Array(this.fieldSize);
			this.mistakes[x] = new Array(this.fieldSize);

			for (let y = 0; y < this.fieldSize; y++) {
				this.field[x][y] = CELL_UNKNOWN;
				this.mines[x][y] = 0;
				this.mistakes[x][y] = 0;
			}
		}

		this.isNewGame = true;
		this.isGameOver = false;
		this.isFinished = false;
		this.startTime = null;
		this.endTime = null;
		clearInterval(this.intervalId);
		this.intervalId = setInterval(() => this.writeTime(), 50);
		this.flagOnClick = false;

		// set cool smiley
		this.smiley.src = "img/cool.png";

		// event
		if (typeof this.onNewGame === "function") {
			this.onNewGame();
		}

		this.draw();
	}

	/*
	 * scale up function
	 */
	scaleUp() {
		if (this.isNewGame && this.fieldSize < 16) {
			this.fieldSize++;
			this.dimensions();
			this.newGame(); // re-init field arrays
		}
	}

	/*
	 * scale down function
	 */
	scaleDown() {
		if (this.isNewGame && this.fieldSize > 6) {
			this.fieldSize--;
			this.dimensions();
			this.newGame(); // re-init field arrays
		}
	}

	/*
	 * difficulty setter function
	 * 0 = easy, 1 = normal, 2 = hard, 3 = extreme
	 */
	setDifficulty(d) {
		if (this.isNewGame && d >= 0 && d <= 3) {
			this.gameDifficulty = d;
			this.minesDensity = MINE_DENSITY[d];
			return true;
		}
		return false;
	}

	/*
	 * scale setter function
	 * 6 - 16
	 */
	newGameScale(s) {
		if (s >= 6 && s <= 16) {
			this.fieldSize = s;
			this.dimensions();
			this.newGame(); // re-init field arrays
		}
	}

	getDifficulty() {
		return this.gameDifficulty;
	}

	getScore() {
		return this.isFinished ? this.score : 0;
	}

	/*
	 * style setter function
	 * 0 = style 1, 1 = style 2, 2 = style 3
	 */
	setStyle(s, redraw) {
		if (s !== 0 && s !== 1 && s !== 2) {
			return false;
		}

		this.style = STYLES[s];

		// initialize image objects
		this.loadingImages = 12; // 12 images to load

		const onImageLoaded = () => this.onImageLoaded();

		this.images = {};
		const baseImages = {
			bomb: "img/bomb.png",
			explode: "img/explode.png",
			flag: "img/flag.png",
			mark: "img/mark.png",
		};
		for (const [name, src] of Object.entries(baseImages)) {
			const img = new Image();
			img.onload = onImageLoaded;
			img.src = src;
			this.images[name] = img;
		}

		const counterDir = s < 2 ? "numbers" : "pieces";
		this.imageCounter = [];
		for (let i = 0; i < 8; i++) {
			const img = new Image();
			img.onload = onImageLoaded;
			img.src = `img/${counterDir}/${i + 1}.png`;
			this.imageCounter[i] = img;
		}

		this.dimensions();
		if (redraw) {
			this.draw();
		}

		return true;
	}

	/*
	 * calls the redraw function if there are no more images to load
	 */
	onImageLoaded() {
		if (this.loadingImages > 0) {
			this.loadingImages--;
		}

		if (this.loadingImages === 0) {
			this.draw();
		}
	}

	/*
	 * set mute function
	 */
	setMute(m) {
		this.mute = !!m;
	}

	/*
	 * writes time into time holder
	 */
	writeTime() {
		let diff;

		if (this.startTime != null) {
			if (this.endTime != null) {
				diff = this.endTime.getTime() - this.startTime.getTime();
				clearInterval(this.intervalId);
			} else {
				diff = Date.now() - this.startTime.getTime();
			}
		} else {
			diff = 0;
		}

		const min = Math.floor(diff / 60000.0).toString();
		const sec = Math.floor((diff % 60000) / 1000.0).toString().padStart(2, "0");
		const msec = Math.floor((diff % 1000) / 10.0).toString().padStart(2, "0");

		this.timeHolder.nodeValue = `${min}:${sec}.${msec}`;
	}

	/*
	 * set dimensions for drawing function
	 */
	dimensions() {
		const padding = this.style.padding;

		if (this.canvas.width >= this.canvas.height) {
			this.playArea = [
				Math.round(this.canvas.width / 2.0 - this.canvas.height / 2.0) + padding,
				padding,
				this.canvas.height - 2 * padding,
				this.canvas.height - 2 * padding,
			];
		} else {
			this.playArea = [
				padding,
				Math.round(this.canvas.height / 2.0 - this.canvas.width / 2.0) + padding,
				this.canvas.width - 2 * padding,
				this.canvas.width - 2 * padding,
			];
		}

		this.blockMargin = Math.round(this.playArea[2] / this.fieldSize * this.style.blockMarginRatio);
		this.blockSize = Math.round((this.playArea[2] - this.blockMargin) / this.fieldSize) - this.blockMargin;
	}

	refreshDimensions() {
		this.dimensions();
		this.draw();
	}

	/*
	 * check if gameplay finished
	 */
	checkIfFinished() {
		if (this.isGameOver) {
			// set end time
			this.endTime = new Date();

			for (let x = 0; x < this.fieldSize; x++) {
				for (let y = 0; y < this.fieldSize; y++) {
					this.discover(x, y, false);
				}
			}

			// set sad smiley
			this.smiley.src = "img/sad.png";

			// event
			if (typeof this.onGameOver === "function") {
				this.onGameOver();
			}
			return;
		}

		for (let x = 0; x < this.fieldSize; x++) {
			for (let y = 0; y < this.fieldSize; y++) {
				if (this.field[x][y] < 0 && this.mines[x][y] === 0) {
					return; // not finished - yet
				}
			}
		}

		this.endTime = new Date();
		for (let x = 0; x < this.fieldSize; x++) {
			for (let y = 0; y < this.fieldSize; y++) {
				if (this.field[x][y] < 0 && this.mines[x][y] !== 0) {
					this.field[x][y] = 0;
				}
			}
		}

		// set game state and happy smiley
		this.isFinished = true;
		this.smiley.src = "img/happy.png";

		// time
		const diff = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 100.0);
		this.score = Math.floor(10000 * this.minesDensity * this.fieldSize / Math.pow(diff, 1.0 / 3.0));

		// event
		if (typeof this.onFinished === "function") {
			this.onFinished();
		}
	}

	/*
	 * place mines after the first click
	 * startX and startY indicate the place where no mine has to be
	 */
	placeMines(startX, startY) {
		const numberOfMines = this.minesDensity * Math.pow(this.fieldSize, 2);

		// place mines
		let i = 0;
		while (i < numberOfMines) {
			const x = Math.round(Math.random() * (this.fieldSize - 1));
			const y = Math.round(Math.random() * (this.fieldSize - 1));

			if (this.mines[x][y] === 0 &&
			    (Math.abs(startX - x) > 1 || Math.abs(startY - y) > 1)) {
				this.mines[x][y] = 1;
				i++;
			}
		}
	}

	/*
	 * click event
	 */
	onClick(e, rightbtn) {
		let x, y;

		if (e.pageX || e.pageY) {
			x = e.pageX - this.canvas.offsetLeft;
			y = e.pageY - this.canvas.offsetTop;
		} else {
			x = e.clientX + document.body.scrollLeft +
			    document.documentElement.scrollLeft - this.canvas.offsetLeft;
			y = e.clientY + document.body.scrollTop +
			    document.documentElement.scrollTop - this.canvas.offsetTop;
		}

		const playArea = this.playArea;

		// if the user has clicked into the play area
		if (x >= playArea[0] && x <= playArea[0] + playArea[2] &&
		    y >= playArea[1] && y <= playArea[1] + playArea[3] &&
		    !this.isGameOver && !this.isFinished) {
			let blockX = x - playArea[0] - this.blockMargin;
			let blockY = y - playArea[1] - this.blockMargin;

			// if the user has clicked on a block
			if (blockX % (this.blockSize + this.blockMargin) <= this.blockSize &&
			    blockY % (this.blockSize + this.blockMargin) <= this.blockSize) {
				blockX = Math.floor(blockX / (this.blockSize + this.blockMargin));
				blockY = Math.floor(blockY / (this.blockSize + this.blockMargin));

				// place mines
				if (this.isNewGame) {
					if (!rightbtn && !e.ctrlKey && !e.shiftKey) {
						this.placeMines(blockX, blockY);
						this.isNewGame = false;
						this.startTime = new Date();
					}

					// event
					if (typeof this.onStartGame === "function") {
						this.onStartGame();
					}
				}

				if (!this.isNewGame) {
					this.handleBlockClick(blockX, blockY, e, rightbtn);
				}
			}
		}
	}

	/*
	 * handles a click on a specific block
	 */
	handleBlockClick(blockX, blockY, e, rightbtn) {
		if (this.field[blockX][blockY] < 0) {
			if (rightbtn || e.ctrlKey || this.flagOnClick) {
				if ((rightbtn || e.ctrlKey) && this.field[blockX][blockY] === CELL_FLAG) {
					this.field[blockX][blockY] = CELL_UNKNOWN;
				} else {
					this.field[blockX][blockY] = CELL_FLAG;
					this.flagOnClick = false;
					this.playSound("flag");
				}
			} else if (e.shiftKey) {
				if (this.field[blockX][blockY] === CELL_MARK) {
					this.field[blockX][blockY] = CELL_UNKNOWN;
				} else {
					this.field[blockX][blockY] = CELL_MARK;
					this.playSound("flag");
				}
			} else if (this.field[blockX][blockY] < CELL_UNKNOWN) {
				this.field[blockX][blockY] = CELL_UNKNOWN;
			} else if (this.field[blockX][blockY] < 0) {
				if (this.discover(blockX, blockY, true) > 0) {
					if (this.isGameOver) {
						this.playSound("boom");
					} else {
						this.playSound("discover");
					}
					this.checkIfFinished();
				}
			}
			this.draw();
		} else if (!rightbtn && !e.ctrlKey && !e.shiftKey) {
			if (this.gameDifficulty < 2 && this.mines[blockX][blockY] === 0) {
				if (this.checkFlags(blockX, blockY, true)) {
					if (this.fixFlags(blockX, blockY) > 0) {
						this.playSound("discover");
						this.checkIfFinished();
						this.draw();
					} else {
						this.flagOnClick = true;
					}
				} else {
					this.flagOnClick = true;
					if (!this.checkFlags(blockX, blockY, false)) {
						if (this.removeFlags(blockX, blockY) > 0) {
							this.draw();
						}
					}
				}
			} else {
				this.flagOnClick = true;
			}
		}
	}

	/*
	 * field discover function
	 * marks fields as discovered and sets the number of
	 * mines near this field.
	 */
	discover(x, y, adjacent) {
		let count = 0;

		// check if square already discovered
		if (this.field[x][y] >= 0) {
			return 0;
		}

		// check for mine
		if (this.mines[x][y] !== 0) {
			// user has discovered a mine :)
			this.field[x][y] = 0;
			if (!this.isGameOver) {
				this.mistakes[x][y] = 1;
				this.isGameOver = true; // :D
			}
			return 1;
		}

		// mark false flags as mistakes
		if (this.isGameOver && this.field[x][y] < CELL_UNKNOWN) {
			this.mistakes[x][y] = 1;
		}

		// set number of near mines
		this.field[x][y] = this.adjacentMines(x, y, false);
		count++;

		if (adjacent && this.adjacentMines(x, y, true) === 0) {
			count += this.discoverAdjacent(x, y);
		}

		return count;
	}

	/*
	 * Calls the discover function for every adjacent field
	 */
	discoverAdjacent(x, y) {
		let count = 0;
		const size = this.fieldSize;

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (dx === 0 && dy === 0) {
					continue;
				}
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < size && ny >= 0 && ny < size &&
				    this.field[nx][ny] === CELL_UNKNOWN) {
					count += this.discover(nx, ny, true);
				}
			}
		}

		return count;
	}

	/*
	 * Returns the number of undiscovered adjacent mines
	 * @param undiscovered: if true, returns only number of undiscovered mines
	 */
	adjacentMines(x, y, undiscovered) {
		let mineCount = 0;
		const size = this.fieldSize;

		// helper checking if a field has a mine (and is undiscovered)
		const hasMine = (mx, my) => {
			if (undiscovered) {
				return this.field[mx][my] < 0 && this.mines[mx][my] !== 0;
			}
			return this.mines[mx][my] !== 0;
		};

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (dx === 0 && dy === 0) {
					continue;
				}
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < size && ny >= 0 && ny < size && hasMine(nx, ny)) {
					mineCount++;
				}
			}
		}

		return mineCount;
	}

	/*
	 * Function checking, if the user has set all flags correctly
	 * This is the case, when every mine around has a flag
	 * false if (hasFlag != hasMine)
	 */
	checkFlags(x, y, total) {
		const size = this.fieldSize;

		// helper checking if a flag has been set correctly
		// or a field already has been discovered
		const isCorrect = (cx, cy) => {
			if (total) {
				return this.field[cx][cy] >= 0 ||
				       (this.field[cx][cy] === CELL_FLAG) === (this.mines[cx][cy] !== 0);
			}
			return this.field[cx][cy] >= 0 || this.mines[cx][cy] !== 0 ||
			       (this.field[cx][cy] === CELL_FLAG) === (this.mines[cx][cy] !== 0);
		};

		// if the field contains a mine, return false
		// this occurs when the user clicks on a discovered mine
		if (this.mines[x][y] !== 0) {
			return false;
		}

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (dx === 0 && dy === 0) {
					continue;
				}
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < size && ny >= 0 && ny < size && !isCorrect(nx, ny)) {
					return false;
				}
			}
		}

		return true;
	}

	/*
	 * Sets correctly flagged fields to discovered state
	 */
	fixFlags(x, y) {
		let count = 0;
		const size = this.fieldSize;

		// helper checking if there is a flagged mine
		const flaggedMine = (mx, my) => this.field[mx][my] === CELL_FLAG && this.mines[mx][my] !== 0;

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (dx === 0 && dy === 0) {
					continue;
				}
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < size && ny >= 0 && ny < size && flaggedMine(nx, ny)) {
					this.field[nx][ny] = 0;
					if (this.adjacentMines(nx, ny, true) === 0) {
						count += this.discoverAdjacent(nx, ny);
					}
					count++;
				}
			}
		}

		return count;
	}

	/*
	 * Removes all adjacent flags
	 */
	removeFlags(x, y) {
		let count = 0;
		const size = this.fieldSize;

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (dx === 0 && dy === 0) {
					continue;
				}
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < size && ny >= 0 && ny < size &&
				    this.field[nx][ny] === CELL_FLAG) {
					this.field[nx][ny] = CELL_UNKNOWN;
					count++;
				}
			}
		}

		return count;
	}

	/*
	 * draw function
	 */
	draw() {
		const ctx = this.context;
		const style = this.style;

		// only continue if all images are loaded, else wait for event
		this.loadingRedraw = true;
		if (this.loadingImages > 0) {
			return;
		}
		this.loadingRedraw = false;

		// clear
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// draw background
		if (style.colorBackground2 !== "") {
			const g = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
			g.addColorStop(0, style.colorBackground1);
			g.addColorStop(1, style.colorBackground2);
			ctx.fillStyle = g;
		} else {
			ctx.fillStyle = style.colorBackground1;
		}
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		const playArea = this.playArea;

		// draw play and control areas
		if (style.colorArea !== "") {
			ctx.fillStyle = style.colorArea;
			ctx.fillRect(playArea[0], playArea[1], playArea[2], playArea[3]);
		}
		if (style.colorAreaStroke !== "") {
			ctx.strokeStyle = style.colorAreaStroke;
			ctx.strokeRect(playArea[0], playArea[1], playArea[2], playArea[3]);
		}

		for (let x = 0; x < this.field.length; x++) {
			for (let y = 0; y < this.field[x].length; y++) {
				// define block coordinates
				const bX = playArea[0] + this.blockMargin + (this.blockMargin + this.blockSize) * x;
				const bY = playArea[1] + this.blockMargin + (this.blockMargin + this.blockSize) * y;
				const bW = this.blockSize;
				const bH = this.blockSize;

				if (this.field[x][y] >= 0) {
					if (style.colorBlockDiscovered !== "") {
						ctx.fillStyle = style.colorBlockDiscovered;
						ctx.fillRect(bX, bY, bW, bH);
					}
					if (style.colorBlockDiscoveredStroke !== "") {
						ctx.strokeStyle = style.colorBlockDiscoveredStroke;
						ctx.strokeRect(bX, bY, bW, bH);
					}
				} else {
					if (style.colorBlockUnknown !== "") {
						ctx.fillStyle = style.colorBlockUnknown;
						ctx.fillRect(bX, bY, bW, bH);
					}
					if (style.colorBlockUnknownStroke !== "") {
						ctx.strokeStyle = style.colorBlockUnknownStroke;
						ctx.strokeRect(bX, bY, bW, bH);
					}
				}

				// mark mistakes
				if (this.mistakes[x][y] !== 0) {
					if (style.colorBlockMistaken !== "") {
						ctx.fillStyle = style.colorBlockMistaken;
						ctx.fillRect(bX, bY, bW, bH);
					}
					if (style.colorBlockMistakenStroke !== "") {
						ctx.strokeStyle = style.colorBlockMistakenStroke;
						ctx.strokeRect(bX, bY, bW, bH);
					}
				}

				// draw the appropriate piece
				if (this.field[x][y] === CELL_FLAG) {
					ctx.drawImage(this.images.flag, bX, bY, bW, bH);
				} else if (this.field[x][y] === CELL_MARK) {
					ctx.drawImage(this.images.mark, bX, bY, bW, bH);
				} else if (this.field[x][y] >= 0 && this.mines[x][y] !== 0) {
					if (this.mistakes[x][y] !== 0) {
						ctx.drawImage(this.images.explode, bX, bY, bW, bH);
					} else {
						ctx.drawImage(this.images.bomb, bX, bY, bW, bH);
					}
				} else if (this.field[x][y] > 0) {
					ctx.drawImage(this.imageCounter[this.field[x][y] - 1], bX, bY, bW, bH);
				}
			}
		}
	}
}
