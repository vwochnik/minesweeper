let myGame;

class Game {
	constructor() {
		this.myMine = null;
		this.myHowtoPopup = null;
		this.gameState = null;
		this.scoreForm = null;
		this.buttons = {};
		this.playing = false; // if true, when clicked on smiley, then no settings

		this.init();
	}

	init() {
		this.myHowtoPopup = new Popup("howtolink", 392, 522, true);

		if (!document.getElementById || !document.addEventListener || !window.addEventListener) {
			return;
		}

		// get buttons
		const ids = {
			gameBtn: "msgamebtn",
			size1Btn: "mssize1btn",
			size2Btn: "mssize2btn",
			size3Btn: "mssize3btn",
			size4Btn: "mssize4btn",
			easyBtn: "mseasybtn",
			normalBtn: "msnormalbtn",
			hardBtn: "mshardbtn",
			extremeBtn: "msextremebtn",
			style1Btn: "msstyle1btn",
			style2Btn: "msstyle2btn",
			style3Btn: "msstyle3btn",
			okBtn: "msokbtn",
		};
		for (const [key, id] of Object.entries(ids)) {
			this.buttons[key] = document.getElementById(id);
		}
		this.scoreForm = document.getElementById("msscoreform");

		const b = this.buttons;
		const sizes = [6, 9, 12, 16];

		// associate events
		if (b.gameBtn && b.size1Btn && b.size2Btn && b.size3Btn && b.size4Btn &&
		    b.easyBtn && b.normalBtn && b.hardBtn && b.extremeBtn && b.style1Btn &&
		    b.style2Btn && b.style3Btn && b.okBtn) {
			b.gameBtn.addEventListener("click", () => this.onGameBtn(), false);
			b.size1Btn.addEventListener("click", () => this.onSizeBtn(0, sizes[0]), false);
			b.size2Btn.addEventListener("click", () => this.onSizeBtn(1, sizes[1]), false);
			b.size3Btn.addEventListener("click", () => this.onSizeBtn(2, sizes[2]), false);
			b.size4Btn.addEventListener("click", () => this.onSizeBtn(3, sizes[3]), false);
			b.easyBtn.addEventListener("click", () => this.onDifficultyBtn(0), false);
			b.normalBtn.addEventListener("click", () => this.onDifficultyBtn(1), false);
			b.hardBtn.addEventListener("click", () => this.onDifficultyBtn(2), false);
			b.extremeBtn.addEventListener("click", () => this.onDifficultyBtn(3), false);
			b.style1Btn.addEventListener("click", () => this.onStyleBtn(0), false);
			b.style2Btn.addEventListener("click", () => this.onStyleBtn(1), false);
			b.style3Btn.addEventListener("click", () => this.onStyleBtn(2), false);
			b.okBtn.addEventListener("click", () => this.setGameState("ingame"), false);
			if (this.scoreForm) {
				this.scoreForm.addEventListener("submit", () => this.onSubmit(), false);
			}
		}

		// resize event
		window.addEventListener("resize", () => this.onResize(), false);
		if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
			window.addEventListener("orient", () => this.onResize(), false);
		}

		// initialize game object
		this.onResize(); // first set canvas size <dirty>
		this.setGameState("ingame");
		this.myMine = new Minesweeper();

		// attach events
		this.myMine.onNewGame = () => { this.playing = false; };
		this.myMine.onStartGame = () => { this.playing = true; };
		this.myMine.onGameOver = () => { this.playing = true; };
		this.myMine.onFinished = () => { this.playing = false; this.setGameState("form"); };

		// start new game
		this.myMine.setStyle(0, false);
		this.myMine.newGameScale(9);
		this.myMine.setDifficulty(1);
		b.size2Btn.className = "active small";
		b.normalBtn.className = "active small";
		b.style1Btn.className = "active small";
	}

	/*
	 * site state
	 */
	setGameState(s) {
		this.gameState = s;
		if (s === "ingame") {
			document.getElementById("msbtn").className = "ingame";
			document.getElementById("mstime").className = "ingame";
			document.getElementById("mswrapper").style.display = "block";
			document.getElementById("mssettings").style.display = "none";
			document.getElementById("msform").style.display = "none";
		} else {
			document.getElementById("msbtn").className = "";
			document.getElementById("mstime").className = "";
			document.getElementById("mswrapper").style.display = "none";

			if (s === "form") {
				document.getElementById("msscore").firstChild.nodeValue = this.myMine.getScore();
				document.getElementById("mssettings").style.display = "none";
				document.getElementById("msform").style.display = "inline";
			} else {
				document.getElementById("mssettings").style.display = "inline";
				document.getElementById("msform").style.display = "none";
			}
		}
	}

	onGameBtn() {
		if (this.gameState !== "settings" && !this.playing) {
			this.myMine.newGame();
			this.setGameState("settings");
		} else {
			if (this.playing) {
				this.myMine.newGame();
			}
			this.setGameState("ingame");
		}
	}

	onSizeBtn(index, scale) {
		this.myMine.newGameScale(scale);
		const map = ["size1Btn", "size2Btn", "size3Btn", "size4Btn"];
		map.forEach((key, i) => {
			this.buttons[key].className = i === index ? "active small" : "small";
		});
	}

	onDifficultyBtn(d) {
		if (this.myMine.setDifficulty(d)) {
			const map = ["easyBtn", "normalBtn", "hardBtn", "extremeBtn"];
			map.forEach((key, i) => {
				this.buttons[key].className = i === d ? "active small" : "small";
			});
		}
	}

	onStyleBtn(s) {
		if (this.myMine.setStyle(s)) {
			const map = ["style1Btn", "style2Btn", "style3Btn"];
			map.forEach((key, i) => {
				this.buttons[key].className = i === s ? "active small" : "small";
			});
		}
	}

	onResize() {
		const w = document.getElementById("mswrapper");
		const c = document.getElementById("mscanvas");

		if (c && w) {
			c.width = w.clientWidth;
			c.height = w.clientWidth;
		}

		if (this.myMine) {
			this.myMine.refreshDimensions();
		}
	}

	/*
	 * adds necessary form nodes containing score and time
	 */
	onSubmit() {
		// append difficulty to form
		const input1 = document.createElement("input");
		input1.setAttribute("type", "hidden");
		input1.setAttribute("name", "difficulty");
		input1.setAttribute("value", this.myMine.getDifficulty());
		this.scoreForm.appendChild(input1);

		// append score to form
		const input2 = document.createElement("input");
		input2.setAttribute("type", "hidden");
		input2.setAttribute("name", "score");
		input2.setAttribute("value", this.myMine.getScore());
		this.scoreForm.appendChild(input2);

		return true;
	}
}

if (window.addEventListener) {
	window.addEventListener("load", () => { myGame = new Game(); }, false);
} else {
	alert("Error initializing game.");
}
