let myGame;

class Game {
	constructor() {
		this.myMine = null;
		this.scoreForm = null;
		this.buttons = {};

		this.init();
	}

	init() {
		if (!document.getElementById || !document.addEventListener) {
			return;
		}

		// get buttons
		const ids = {
			gameBtn: "msgamebtn",
			reduceBtn: "msreducebtn",
			expandBtn: "msexpandbtn",
			easyBtn: "mseasybtn",
			normalBtn: "msnormalbtn",
			hardBtn: "mshardbtn",
			extremeBtn: "msextremebtn",
			style1Btn: "msstyle1btn",
			style2Btn: "msstyle2btn",
			style3Btn: "msstyle3btn",
		};
		for (const [key, id] of Object.entries(ids)) {
			this.buttons[key] = document.getElementById(id);
		}
		this.scoreForm = document.getElementById("msscoreform");

		const b = this.buttons;

		// associate events
		if (b.gameBtn && b.reduceBtn && b.expandBtn && b.easyBtn && b.normalBtn &&
		    b.hardBtn && b.extremeBtn && b.style1Btn && b.style2Btn && b.style3Btn) {
			b.gameBtn.addEventListener("click", () => this.myMine.newGame(), false);
			b.reduceBtn.addEventListener("click", () => this.myMine.scaleDown(), false);
			b.expandBtn.addEventListener("click", () => this.myMine.scaleUp(), false);
			b.easyBtn.addEventListener("click", () => this.onDifficultyBtn(0), false);
			b.normalBtn.addEventListener("click", () => this.onDifficultyBtn(1), false);
			b.hardBtn.addEventListener("click", () => this.onDifficultyBtn(2), false);
			b.extremeBtn.addEventListener("click", () => this.onDifficultyBtn(3), false);
			b.style1Btn.addEventListener("click", () => this.onStyleBtn(0), false);
			b.style2Btn.addEventListener("click", () => this.onStyleBtn(1), false);
			b.style3Btn.addEventListener("click", () => this.onStyleBtn(2), false);
			if (this.scoreForm) {
				this.scoreForm.addEventListener("submit", () => this.onSubmit(), false);
			}
		}

		// initialize game object
		this.myMine = new Minesweeper();

		// attach events
		this.myMine.onNewGame = () => this.showScoreForm(false);
		this.myMine.onFinished = () => this.showScoreForm(true);

		// start new game
		this.myMine.setStyle(0, false);
		this.myMine.newGameScale(9);
		this.myMine.setDifficulty(1);
		b.normalBtn.className = "active small";
		b.style1Btn.className = "active small";
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

	/*
	 * shows or hides the submit form
	 */
	showScoreForm(show) {
		if (show) {
			document.getElementById("msscore").firstChild.nodeValue = this.myMine.getScore();
			document.getElementById("mssettings").style.display = "none";
			document.getElementById("msform").style.display = "inline";
		} else {
			document.getElementById("mssettings").style.display = "inline";
			document.getElementById("msform").style.display = "none";
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
