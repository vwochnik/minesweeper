/*
 * The mine sweeper game class
 */
function Minesweeper() {
	// help variable storing 'this' for onclick event
	var instance = this;

	// html elements
	var canvas, smiley, timeHolder;
	// 2d context and game state
	var context;
	var isNewGame, isGameOver, isFinished;
	// game difficulty and score
	var gameDifficulty, score, flagOnClick;
	// time measurement
	var startTime, endTime, intervalId;
	// field size and number of mines
	var fieldSize, minesDensity;

	// 2-dimensional arrays
	// field array stores discovered fields
	// -3 = marker, -2 = bomb flag, -1 = undiscovred
	// 0 = zero mines next to this block, 1 - 8 = number of mines next to
	// the block
	var field, mines, mistakes;

	// style settings and images
	var playArea, blockSize, blockMargin;
	var padding, blockMarginRatio;
	var colorBackground1, colorBackground2;
	var colorArea, colorAreaStroke,
	    colorBlockUnknown, colorBlockUnknownStroke,
	    colorBlockDiscovered, colorBlockDiscoveredStroke,
	    colorBlockMistaken, colorBlockMistakenStroke;
	var imageBomb, imageExplode, imageFlag, imageMark,
	    imageCounter;
	var loadingImages, loadingRedraw;

	// sounds
	var sounds, hasSound, mute;

	// public members
	instance.newGame = newGame;
	instance.scaleUp = scaleUp;
	instance.scaleDown = scaleDown;
	instance.refreshDimensions = refreshDimensions;
	instance.setDifficulty = setDifficulty;
	instance.newGameScale = newGameScale;
	instance.getDifficulty = getDifficulty;
	instance.getScore = getScore;
	instance.setStyle = setStyle;
	instance.setMute = setMute;
	instance.onGameOver = null;
	instance.onFinished = null;
	instance.onNewGame = null;
	instance.onStartGame = null;

	// initialize variables
	init();

	/*
	 * init function
	 */
	function init() {
		fieldSize = 10;
		gameDifficulty = 1;
		score = 0;

		if (document.getElementById) {
			smiley = document.getElementById("mssmiley");
			canvas = document.getElementById("mscanvas");
			timeHolder = document.getElementById("mstimespan").firstChild;

			if ((canvas.getContext) && (canvas.addEventListener)) {
				context = canvas.getContext("2d");
				canvas.addEventListener("mousedown",
					                    function(e) { e.preventDefault(); }, false);
				canvas.addEventListener("mouseup",
					                    function(e) { e.preventDefault(); }, false);
				canvas.addEventListener("click",
					                    function(e) { onClick(e, false);
					                                  e.preventDefault(); }, false);
				canvas.addEventListener("contextmenu",
					                    function(e) { onClick(e, true);
					                                  e.preventDefault(); }, false);

				// initialize sounds
				initSounds();
			}
		}
	}

	function initSounds() {
		// check for support
		hasSound = true;
		try {
			if (!new Audio().canPlayType) {
				hasSound = false;
			}
		} catch (e) {
			hasSound = false;
		}

		// activate sound by default
		mute = false;

		sounds = new Array();
		loadSound("boom");
		loadSound("discover");
		loadSound("flag");
	}

	/*
	 * Loads a specific sound
	 */
	function loadSound(snd) {
		if (hasSound) {
			sounds[snd] = new Audio();
			if (sounds[snd].canPlayType("audio/ogg").match(/^(maybe|probably)$/i)) {
				sounds[snd].src = "/minesweeper/sounds/"+snd+".ogg";
			} else if (sounds[snd].canPlayType("audio/mp3").match(/^(maybe|probably)$/i)) {
				sounds[snd].src = "/minesweeper/sounds/"+snd+".mp3";
			} else {
				sounds[snd].src = "/minesweeper/sounds/"+snd+".wav";
			}

			sounds[snd].addEventListener("ended",
			                             function(e) { sounds[snd].load(); }, false);
			sounds[snd].load();
		} else {
			sounds[snd] = null;
		}
	}

	/*
	 * Plays a previously loaded sound
	 */
	function playSound(snd) {
		if ((!hasSound) || (mute) || (sounds[snd] == null) || (sounds[snd].error)) {
			return;
		}

		if (sounds[snd].aborted) {
			sounds[snd].load();
		} else if (sounds[snd].currentTime > 0) {
			sounds[snd].load();
		}
		sounds[snd].play();
	}

	/*
	 * starts a new game
	 */
	function newGame() {
		// create arrays
		field = new Array(fieldSize);
		mines = new Array(fieldSize);
		mistakes = new Array(fieldSize);

		for (var x = 0; x < fieldSize; x++) {
			field[x] = new Array(fieldSize);
			mines[x] = new Array(fieldSize);
			mistakes[x] = new Array(fieldSize);

			for (var y = 0; y < fieldSize; y++) {
				field[x][y] = -1;
				mines[x][y] = 0;
				mistakes[x][y] = 0;
			}
		}

		isNewGame = true;
		isGameOver = false;
		isFinished = false;
		startTime = null;
		endTime = null;
		clearInterval(intervalId);
		intervalId = setInterval(writeTime, 50);
		flagOnClick = false;

		// set cool smiley
		smiley.src = "/minesweeper/img/cool.png";

		// event
		if (typeof instance.onNewGame == 'function') {
			instance.onNewGame();
		}

		draw();
	}

	/*
	 * scale up function
	 */
	function scaleUp() {
		if (isNewGame) {
			if (fieldSize < 16) {
				fieldSize++;
				dimensions();
				newGame(); // re-init field arrays
			}
		}
	}

	/*
	 * scale down function
	 */
	function scaleDown() {
		if (isNewGame) {
			if (fieldSize > 6) {
				fieldSize--;
				dimensions();
				newGame(); // re-init field arrays
			}
		}
	}

	/*
	 * difficulty setter function
	 * 0 = easy, 1 = normal, 2 = hard, 3 = extreme
	 */
	function setDifficulty(d) {
		if ((isNewGame) && (d >= 0) && (d <= 3)) {
			gameDifficulty = d;
			if (d == 0) {
				minesDensity = 1.0/8.0;
			} else if (d == 1) {
				minesDensity = 1.0/6.0;
			} else if (d == 2) {
				minesDensity = 1.0/4.0;
			} else if (d == 3) {
				minesDensity = 1.0/2.0;
			}
			return true;
		}
		return false;
	}

	/*
	 * scale setter function
	 * 6 - 16
	 */
	function newGameScale(s) {
		if ((s >= 6) && (s <= 16)) {
			fieldSize = s;
			dimensions();
			newGame(); // re-init field arrays
		}
	}

	function getDifficulty() {
		return gameDifficulty;
	}

	function getScore() {
		if (isFinished) {
			return score;
		} else {
			return 0;
		}
	}

	/*
	 * style setter function
	 * 0 = style 1, 1 = style 2, 2 = style 3
	 */
	function setStyle(s, redraw) {
		var c;

		if ((s != 0) && (s != 1) && (s != 2)) {
			return false;
		}

		if (s == 0) {
			padding = 8;
			blockMarginRatio = 0.1;
			colorBackground1 = "rgba(62, 62, 73, 1.0)";
			colorBackground2 = "rgba(127, 127, 152, 1.0)";
			colorArea = "";
			colorAreaStroke = "";
			colorBlockUnknown = "rgba(44, 44, 54, 0.6)";
			colorBlockUnknownStroke = "rgba(44, 44, 54, 0.8)";
			colorBlockDiscovered = "rgba(145, 145, 179, 0.6)";
			colorBlockDiscoveredStroke = "rgba(115, 115, 142, 0.8)";
			colorBlockMistaken = "rgba(255, 0, 0, 0.3)";
			colorBlockMistakenStroke = "rgba(255, 224, 224, 0.6)";
		} else if (s == 1) {
			padding = 8;
			blockMarginRatio = 0.05;
			colorBackground1 = "rgb(50, 100, 50)";
			colorBackground2 = "rgb(30, 60, 30)";
			colorArea = "";
			colorAreaStroke = "";
			colorBlockUnknown = "rgba(88, 108, 88, 0.8)";
			colorBlockUnknownStroke = "rgba(88, 108, 88, 0.9)";
			colorBlockDiscovered = "rgba(145, 179, 145, 0.8)";
			colorBlockDiscoveredStroke = "rgba(115, 142, 115, 0.9)";
			colorBlockMistaken = "rgba(255, 0, 0, 0.3)";
			colorBlockMistakenStroke = "rgba(255, 224, 224, 0.6)";
		} else if (s == 2) {
			padding = 8;
			blockMarginRatio = 0.1;
			colorBackground1 = "rgba(244, 244, 255, 1.0)";
			colorBackground2 = "rgba(211, 211, 220, 1.0)";
			colorArea = "";
			colorAreaStroke = "";
			colorBlockUnknown = "rgba(190, 190, 198, 0.6)";
			colorBlockUnknownStroke = "rgba(210, 210, 219, 0.8)";
			colorBlockDiscovered = "rgba(155, 155, 168, 0.6)";
			colorBlockDiscoveredStroke = "rgba(136, 136, 148, 0.8)";
			colorBlockMistaken = "rgba(255, 0, 0, 0.3)";
			colorBlockMistakenStroke = "rgba(255, 224, 224, 0.6)";
		}

		// initialize image objects
		loadingImages = 12; // 12 images to load

		imageBomb = new Image();
		imageBomb.onload = onImageLoaded;
		imageBomb.src = "/minesweeper/img/bomb.png";
		imageExplode = new Image();
		imageExplode.onload = onImageLoaded;
		imageExplode.src = "/minesweeper/img/explode.png";
		imageFlag = new Image();
		imageFlag.onload = onImageLoaded;
		imageFlag.src = "/minesweeper/img/flag.png";
		imageMark = new Image();
		imageMark.onload = onImageLoaded;
		imageMark.src = "/minesweeper/img/mark.png";

		if (s < 2) {
			imageCounter = new Array();
			for (var i = 0; i < 8; i++) {
				c = i + 1;
				imageCounter[i] = new Image();
				imageCounter[i].onload = onImageLoaded;
				imageCounter[i].src = "/minesweeper/img/numbers/"+c+".png";
			}
		} else {
			imageCounter = new Array();
			for (var i = 0; i < 8; i++) {
				c = i + 1;
				imageCounter[i] = new Image();
				imageCounter[i].onload = onImageLoaded;
				imageCounter[i].src = "/minesweeper/img/pieces/"+c+".png";
			}
		}

		dimensions();
		if (redraw) {
			draw();
		}

		return true;
	}

	/*
	 * calls the redraw function if there are no more images to load
	 */
	function onImageLoaded() {
		if (loadingImages > 0) {
			loadingImages--;
		}

		if (loadingImages == 0) {
			draw();
		}
	}

	/*
	 * set mute function
	 */
	function setMute(m) {
		if (m) {
			mute = true;
		} else {
			mute = false;
		}
	}

	/*
	 * writes time into time holder
	 */
	function writeTime() {
		var diff, readable, min, sec, msec;

		if (startTime != null) {
			if (endTime != null) {
				diff = endTime.getTime() - startTime.getTime();
				clearInterval(intervalId);
			} else {
				var now = new Date();
				diff = now.getTime() - startTime.getTime();
			}
		} else {
			diff = 0;
		}

		min = Math.floor(diff / 60000.0).toString();
		sec = Math.floor((diff % 60000) / 1000.0).toString();
		msec = Math.floor((diff % 1000) / 10.0).toString();

		// pad with zeros
		while (sec.length < 2) {
			sec = "0" + sec;
		}
		while (msec.length < 2) {
			msec = "0" + msec;
		}

		readable = min + ":" + sec + "." + msec;
		timeHolder.nodeValue = readable;
	}

	/*
	 * set dimensions for drawing function
	 */
	function dimensions() {
		if (canvas.width >= canvas.height) {
			playArea = new Array(Math.round(canvas.width/2.0
				  - canvas.height/2.0) + padding,
				padding,
				canvas.height - 2*padding,
				canvas.height - 2*padding);
		} else {
			playArea = new Array(padding,
				Math.round(canvas.height/2.0
				  - canvas.width/2.0) + padding,
				  - canvas.width + padding, 
				canvas.width - 2*padding,
				canvas.width - 2*padding);
		}

		blockMargin = Math.round(playArea[2] / fieldSize * blockMarginRatio);
		blockSize = Math.round((playArea[2] - blockMargin) / fieldSize) - blockMargin;
	}

	function refreshDimensions() {
		dimensions();
		draw();
	}

	/*
	 * check if gameplay finished
	 */
	function checkIfFinished() {
		var diff;

		if (isGameOver) {
			// set end time
			endTime = new Date();

			for (var x = 0; x < fieldSize; x++) {
				for (var y = 0; y < fieldSize; y++) {
					discover(x, y, false);
				}
			}

			// set sad smiley
			smiley.src = "/minesweeper/img/sad.png";

			// event
			if (typeof instance.onGameOver == 'function') {
				instance.onGameOver();
			}
		} else {
			for (var x = 0; x < fieldSize; x++) {
				for (var y = 0; y < fieldSize; y++) {
					if ((field[x][y] < 0) && (mines[x][y] == 0)) {
						return; // not finished - yet
					}
				}
			}
			endTime = new Date();
			for (var x = 0; x < fieldSize; x++) {
				for (var y = 0; y < fieldSize; y++) {
					if ((field[x][y] < 0) && (mines[x][y] != 0)) {
						field[x][y] = 0;
					}
				}
			}

			// set game state and happy smiley
			isFinished = true;
			smiley.src = "/minesweeper/img/happy.png";

			// time
			diff = Math.floor((endTime.getTime() - startTime.getTime()) / 100.0);
			score = Math.floor(10000 * minesDensity * fieldSize
				                  / Math.pow(diff, 1.0/3.0));

			// event
			if (typeof instance.onFinished == 'function') {
				instance.onFinished();
			}
		}
	}

	/*
	 * place mines after the first click
	 * startX and startY indicate the place where no mine has to be
	 */
	function placeMines(startX, startY) {
		var numberOfMines;
		numberOfMines = minesDensity * Math.pow(fieldSize, 2);

		// place mines
		var i = 0;
		while (i < numberOfMines) {
			var x = Math.round(Math.random() * (fieldSize-1));
			var y = Math.round(Math.random() * (fieldSize-1));

			if ((mines[x][y] == 0) &&
			    ((Math.abs(startX - x) > 1) || (Math.abs(startY - y) > 1))) {
				mines[x][y] = 1;
				i++;
			}
		}
	}

	/*
	 * click event
	 */
	function onClick(e, rightbtn) {
		var x, y;

		if ((e.pageX) || (e.pageY)) {
			x = e.pageX - canvas.offsetLeft;
			y = e.pageY - canvas.offsetTop;
		} else {
			x = e.clientX + document.body.scrollLeft
			  + document.documentElement.scrollLeft
			  - canvas.offsetLeft;
			y = e.clientY + domyHowtoPopupcument.body.scrollTop
			  + document.documentElement.scrollTop
			  - canvas.offsetTop;
		}

		// if the user has clicked into the play area
		if ((x >= playArea[0]) && (x <= playArea[0] + playArea[2]) &&
		    (y >= playArea[1]) && (y <= playArea[1] + playArea[3]) &&
		    (!isGameOver) && (!isFinished)) {
			var blockX, blockY;

			blockX = x - playArea[0] - blockMargin;
			blockY = y - playArea[1] - blockMargin;

			// if the user has clicked on a block
			if ((blockX % (blockSize + blockMargin) <= blockSize) &&
			    (blockY % (blockSize + blockMargin) <= blockSize)) {
				blockX = Math.floor(blockX / (blockSize + blockMargin));
				blockY = Math.floor(blockY / (blockSize + blockMargin));

				// place mines
				if (isNewGame) {
					if ((!rightbtn) && (!e.ctrlKey) && (!e.shiftKey)) {
						placeMines(blockX, blockY);
						isNewGame = false;
						startTime = new Date();
					}

					// event
					if (typeof instance.onStartGame == 'function') {
						instance.onStartGame();
					}
				}

				if (!isNewGame) {
					if (field[blockX][blockY] < 0) {
						if ((rightbtn) || (e.ctrlKey) || (flagOnClick)) {
							if (((rightbtn) || (e.ctrlKey)) && (field[blockX][blockY] == -2)) {
								field[blockX][blockY] = -1;
							} else {
								field[blockX][blockY] = -2;
								flagOnClick = false;
								playSound("flag");
							}
						} else if (e.shiftKey) {
							if (field[blockX][blockY] == -3) {
								field[blockX][blockY] = -1;
							} else {
								field[blockX][blockY] = -3;
								playSound("flag");
							}
						} else if (field[blockX][blockY] < -1) {
							field[blockX][blockY] = -1;
						} else if (field[blockX][blockY] < 0) {
							if (discover(blockX, blockY, true) > 0) {
								if (isGameOver) {
									playSound("boom");
								} else {
									playSound("discover");
								}
								checkIfFinished();
							}
						}
						draw();
					} else if ((!rightbtn) && (!e.ctrlKey) && (!e.shiftKey)) {
						if ((gameDifficulty < 2) && (mines[blockX][blockY] == 0)) {
							if (checkFlags(blockX, blockY, true)) {
								if (fixFlags(blockX, blockY) > 0) {
									playSound("discover");
									checkIfFinished();
									draw();
								} else {
									flagOnClick = true;
								}
							} else {
								flagOnClick = true;
								if (!checkFlags(blockX, blockY, false)) {
									if (removeFlags(blockX, blockY) > 0) {
										draw();
									}
								}
							}
						} else {
							flagOnClick = true;
						}
					}
				}
			}
		}
	}

	/*
	 * field discover function
	 * marks fields as discovered and sets the number of
	 * mines near this field.
	 */
	function discover(x, y, adjacent) {
		var count = 0;

		// check if square already discovered
		if (field[x][y] >= 0) {
			return 0;
		}

		// check for mine
		if (mines[x][y] != 0) {
			// user has discovered a mine :)
			field[x][y] = 0;
			if (!isGameOver) {
				mistakes[x][y] = 1;
				isGameOver = true; // :D
			}
			return 1;
		}

		// mark false flags as mistakes
		if ((isGameOver) && (field[x][y] < -1)) {
			mistakes[x][y] = 1;
		}

		// set number of near mines
		field[x][y] = adjacentMines(x, y, false);
		count++;

		if ((adjacent) && (adjacentMines(x, y, true) == 0)) {
			count += discoverAdjacent(x, y);
		}

		return count;
	}

	/*
	 * Calls the discover function for every adjacent field
	 */
	function discoverAdjacent(x, y) {
		var count = 0;

		if (x > 0) {
			if ((y > 0) && (field[(x-1)][(y-1)] == -1)) {
				count += discover(x-1,y-1, true);
			}
			if (field[(x-1)][y] == -1) {
				count += discover(x-1,y, true);
			}
			if ((y < fieldSize - 1) && (field[(x-1)][(y+1)] == -1)) {
				count += discover(x-1,y+1, true);
			}
		}
		if ((y > 0) && (field[x][(y-1)] == -1)) {
			count += discover(x,y-1, true);
		}
		if ((y < fieldSize - 1) && (field[x][(y+1)] == -1)) {
			count += discover(x,y+1, true);
		}
		if (x < fieldSize - 1) {
			if ((y > 0) && (field[(x+1)][(y-1)] == -1)) {
				count += discover(x+1,y-1, true);
			}
			if (field[(x+1)][y] == -1) {
				count += discover(x+1,y, true);
			}
			if ((y < fieldSize - 1) && (field[(x+1)][(y+1)] == -1)) {
				count += discover(x+1,y+1, true);
			}
		}

		return count;
	}

	/*
	 * Returns the number of undiscovered adjacent mines
	 * @param undiscovered: if true, returns only number of undiscovered mines
	 */
	function adjacentMines(x, y, undiscovered) {
		var mineCount = 0;

		// helper function checking if a field has a mine
		// and if it is undiscovered
		function hasMine(x, y) {
			if (undiscovered) {
				return ((field[x][y] < 0) && (mines[x][y] != 0));
			} else {
				return (mines[x][y] != 0);
			}
		}

		// check for mines
		if ((x > 0) && (y > 0) && (hasMine(x-1, y-1))) {
			mineCount++; // upper left
		}
		if ((y > 0) && (hasMine(x, y-1))) {
			mineCount++; // above
		}
		if ((x < fieldSize - 1) && (y > 0) && (hasMine(x+1, y-1))) {
			mineCount++; // upper right
		} 
		if ((x < fieldSize - 1) && (hasMine(x+1, y))) {
			mineCount++; // right
		} 
		if ((x < fieldSize - 1) && (y < fieldSize - 1) && (hasMine(x+1, y+1))) {
			mineCount++; // lower right
		} 
		if ((y < fieldSize - 1) && (hasMine(x, y+1))) {
			mineCount++; // below
		} 
		if ((x > 0) && (y < fieldSize - 1) && (hasMine(x-1, y+1))) {
			mineCount++; // lower left
		} 
		if ((x > 0) && (hasMine(x-1, y))) {
			mineCount++; // left
		}

		return mineCount;
	}

	/*
	 * Function checking, if the user has set all flags correctly
	 * This is the case, when every mine arround has a flag
	 * false if (hasFlag != hasMine)
	 */
	function checkFlags(x, y, total) {
		// helper function checking if a flag has been set correctly
        // or a field already has been discovered
		function isCorrect(x, y) {
			if (total) {
				return ((field[x][y] >= 0) ||
					    ((field[x][y] == -2) == (mines[x][y] != 0)));
			} else {
				return ((field[x][y] >= 0) || (mines[x][y] != 0) ||
					    ((field[x][y] == -2) == (mines[x][y] != 0)));
			}
		}

		// if the field contains a mine, return false
		// this occures when the user clicks on a discovered mine
		if (mines[x][y] != 0) {
			return false;
		}

		if ((x > 0) && (y > 0) && (!isCorrect(x-1, y-1))) {
			return false; // upper left
		}
		if ((y > 0) && (!isCorrect(x, y-1))) {
			return false; // above
		}
		if ((x < fieldSize - 1) && (y > 0) && (!isCorrect(x+1, y-1))) {
			return false; // upper right
		} 
		if ((x < fieldSize - 1) && (!isCorrect(x+1, y))) {
			return false; // right
		} 
		if ((x < fieldSize - 1) && (y < fieldSize - 1) && (!isCorrect(x+1, y+1))) {
			return false; // lower right
		} 
		if ((y < fieldSize - 1) && (!isCorrect(x, y+1))) {
			return false; // below
		} 
		if ((x > 0) && (y < fieldSize - 1) && (!isCorrect(x-1, y+1))) {
			return false; // lower left
		} 
		if ((x > 0) && (!isCorrect(x-1, y))) {
			return false; // left
		}
		return true;
	}

	/*
     * Sets correctly flagged fields to discovered state
     */
	function fixFlags(x, y) {
		var count = 0;

		// helper function checking if there is a flagged mine
		function flaggedMine(x, y) {
			return ((field[x][y] == -2) && (mines[x][y] != 0));
		}

		if ((x > 0) && (y > 0) && (flaggedMine(x-1, y-1))) {
			field[(x-1)][(y-1)] = 0; // upper left
			if (adjacentMines(x-1, y-1, true) == 0) {
				count += discoverAdjacent(x-1, y-1);
			}
			count++;
		}
		if ((y > 0) && (flaggedMine(x, y-1))) {
			field[x][(y-1)] = 0; // above
			if (adjacentMines(x, y-1, true) == 0) {
				count += discoverAdjacent(x, y-1);
			}
			count++;
		}
		if ((x < fieldSize - 1) && (y > 0) && (flaggedMine(x+1, y-1))) {
			field[(x+1)][(y-1)] = 0; // upper right
			if (adjacentMines(x+1, y-1, true) == 0) {
				count += discoverAdjacent(x+1, y-1);
			}
			count++;
		} 
		if ((x < fieldSize - 1) && (flaggedMine(x+1, y))) {
			field[(x+1)][y] = 0; // right
			if (adjacentMines(x+1, y, true) == 0) {
				count += discoverAdjacent(x+1, y);
			}
			count++;
		} 
		if ((x < fieldSize - 1) && (y < fieldSize - 1) && (flaggedMine(x+1, y+1))) {
			field[(x+1)][(y+1)] = 0; // lower right
			if (adjacentMines(x+1, y+1, true) == 0) {
				count += discoverAdjacent(x+1, y+1);
			}
			count++;
		} 
		if ((y < fieldSize - 1) && (flaggedMine(x, y+1))) {
			field[x][(y+1)] = 0; // below
			if (adjacentMines(x, y+1, true) == 0) {
				count += discoverAdjacent(x, y+1);
			}
			count++;
		} 
		if ((x > 0) && (y < fieldSize - 1) && (flaggedMine(x-1, y+1))) {
			field[(x-1)][(y+1)] = 0; // lower left
			if (adjacentMines(x-1, y+1, true) == 0) {
				count += discoverAdjacent(x-1, y+1);
			}
			count++;
		} 
		if ((x > 0) && (flaggedMine(x-1, y))) {
			field[(x-1)][y] = 0; // left
			if (adjacentMines(x-1, y, true) == 0) {
				count += discoverAdjacent(x-1, y);
			}
			count++;
		}

		return count;
	}

	/*
     * Removes all adjacent flags
     */
	function removeFlags(x, y) {
		var count = 0;

		// helper function checking if there is a flagged mine
		function hasFlag(x, y) {
			return (field[x][y] == -2);
		}

		if ((x > 0) && (y > 0) && (hasFlag(x-1, y-1))) {
			field[(x-1)][(y-1)] = -1; // upper left
			count++;
		}
		if ((y > 0) && (hasFlag(x, y-1))) {
			field[x][(y-1)] = -1; // above
			count++;
		}
		if ((x < fieldSize - 1) && (y > 0) && (hasFlag(x+1, y-1))) {
			field[(x+1)][(y-1)] = -1; // upper right
			count++;
		} 
		if ((x < fieldSize - 1) && (hasFlag(x+1, y))) {
			field[(x+1)][y] = -1; // right
			count++;
		} 
		if ((x < fieldSize - 1) && (y < fieldSize - 1) && (hasFlag(x+1, y+1))) {
			field[(x+1)][(y+1)] = -1; // lower right
			count++;
		} 
		if ((y < fieldSize - 1) && (hasFlag(x, y+1))) {
			field[x][(y+1)] = -1; // below
			count++;
		} 
		if ((x > 0) && (y < fieldSize - 1) && (hasFlag(x-1, y+1))) {
			field[(x-1)][(y+1)] = -1; // lower left
			count++;
		} 
		if ((x > 0) && (hasFlag(x-1, y))) {
			field[(x-1)][y] = -1; // left
			count++;
		}

		return count;
	}

	/*
	 * draw function
	 */
	function draw() {
		var i, g;

		// only continue if all images are loaded
		// else wait for event
		loadingRedraw = true;
		if (loadingImages > 0) {
			return;
		} else {
			loadingRedraw = false;
		}

		// clear
		context.fillStyle = "rgb(0, 0, 0)";
		context.fillRect(0, 0, canvas.width, canvas.height);

		// draw background
		if (colorBackground2 != "") {
			g = context.createLinearGradient(0, 0, 0, canvas.height);
			g.addColorStop(0, colorBackground1);
			g.addColorStop(1, colorBackground2);
			context.fillStyle = g;
		} else {
			context.fillStyle = colorBackground1;
		}
		context.fillRect(0, 0, canvas.width, canvas.height);

		// draw play and control areas
		if (colorArea != "") {
			context.fillStyle = colorArea;
			context.fillRect(playArea[0], playArea[1], playArea[2], playArea[3]);
		}
		if (colorAreaStroke != "") {
			context.strokeStyle = colorAreaStroke;
			context.strokeRect(playArea[0], playArea[1], playArea[2], playArea[3]);
		}

		for (var x = 0; x < field.length; x++) {
			for (var y = 0; y < field[x].length; y++) {
				// block coordinates
				var bX, bY, bW, bH;

				// define block coordinates
				bX = playArea[0] + blockMargin + (blockMargin + blockSize) * x;
				bY = playArea[1] + blockMargin + (blockMargin + blockSize) * y;
				bW = bH = blockSize;

				if (field[x][y] >= 0) {
					if (colorBlockDiscovered != "") {
						context.fillStyle = colorBlockDiscovered;
						context.fillRect(bX, bY, bW, bH);
					}
					if (colorBlockDiscoveredStroke != "") {
						context.strokeStyle = colorBlockDiscoveredStroke;
						context.strokeRect(bX, bY, bW, bH);
					}
				} else {
					if (colorBlockUnknown != "") {
						context.fillStyle = colorBlockUnknown;
						context.fillRect(bX, bY, bW, bH);
					}
					if (colorBlockUnknownStroke != "") {
						context.strokeStyle = colorBlockUnknownStroke;
						context.strokeRect(bX, bY, bW, bH);
					}
				}

				// mark mistakes
				if (mistakes[x][y] != 0) {
					if (colorBlockMistaken != "") {
						context.fillStyle = colorBlockMistaken;
						context.fillRect(bX, bY, bW, bH);
					}
					if (colorBlockMistakenStroke != "") {
						context.strokeStyle = colorBlockMistakenStroke;
						context.strokeRect(bX, bY, bW, bH);
					}
				}

				// if there is a bomb discovered
				if (field[x][y] == -2) {
					context.drawImage(imageFlag, bX, bY, bW, bH);
				} else if (field[x][y] == -3) {
					context.drawImage(imageMark, bX, bY, bW, bH);
				} else if ((field[x][y] >= 0) && (mines[x][y] != 0)) {
					if (mistakes[x][y] != 0) {
						context.drawImage(imageExplode, bX, bY, bW, bH);
					} else {
						context.drawImage(imageBomb, bX, bY, bW, bH);
					}
				} else if (field[x][y] > 0) {
					i = field[x][y] - 1;
					context.drawImage(imageCounter[i], bX, bY, bW, bH);
				}
			}
		}
	}
}

