var myGame;

function game() {
	var myMine, scoreForm;
	var gameBtn, reduceBtn, expandBtn, easyBtn, normalBtn, hardBtn, extremeBtn,
	    style1Btn, style2Btn, style3Btn;

	function init() {
		if ((document.getElementById) && (document.addEventListener)) {
			// get buttons
			gameBtn = document.getElementById("msgamebtn");
			reduceBtn = document.getElementById("msreducebtn");
			expandBtn = document.getElementById("msexpandbtn");
			easyBtn = document.getElementById("mseasybtn");
			normalBtn = document.getElementById("msnormalbtn");
			hardBtn = document.getElementById("mshardbtn");
			extremeBtn = document.getElementById("msextremebtn");
			style1Btn = document.getElementById("msstyle1btn");
			style2Btn = document.getElementById("msstyle2btn");
			style3Btn = document.getElementById("msstyle3btn");
			scoreForm = document.getElementById('msscoreform');

			// associate events
			if ((gameBtn) && (reduceBtn) && (expandBtn) && (easyBtn) && (normalBtn) &&
			    (hardBtn) && (extremeBtn) && (style1Btn) && (style2Btn) &&
			    (style3Btn)) {
				gameBtn.addEventListener("click", onGameBtn, false);
				reduceBtn.addEventListener("click", onReduceBtn, false);
				expandBtn.addEventListener("click", onExpandBtn, false);
				easyBtn.addEventListener("click", onEasyBtn, false);
				normalBtn.addEventListener("click", onNormalBtn, false);
				hardBtn.addEventListener("click", onHardBtn, false);
				extremeBtn.addEventListener("click", onExtremeBtn, false);
				style1Btn.addEventListener("click", onStyle1Btn, false);
				style2Btn.addEventListener("click", onStyle2Btn, false);
				style3Btn.addEventListener("click", onStyle3Btn, false);
				if (scoreForm) {
					scoreForm.addEventListener("submit", onSubmit, false);
				}
			}

			// initialize game object
			myMine = new Minesweeper();

			// attach events
			myMine.onNewGame = function() { showScoreForm(false); };
			myMine.onFinished = function() { showScoreForm(true); };

			// start new game
			myMine.setStyle(0, false);
			myMine.newGameScale(9);
			myMine.setDifficulty(1);
			normalBtn.className = 'active small';
			style1Btn.className = 'active small';
		}
	}

	init();

	function onGameBtn(e) {
		myMine.newGame();
	}

	function onReduceBtn(e) {
		myMine.scaleDown();
	}

	function onExpandBtn(e) {
		myMine.scaleUp();
	}

	function onEasyBtn(e) {
		if (myMine.setDifficulty(0)) {
			easyBtn.className = 'active small';
			normalBtn.className = hardBtn.className = extremeBtn.className = 'small';
		}
	}

	function onNormalBtn(e) {
		if (myMine.setDifficulty(1)) {
			normalBtn.className = 'active small';
			easyBtn.className = hardBtn.className = extremeBtn.className = 'small';
		}
	}

	function onHardBtn(e) {
		if (myMine.setDifficulty(2)) {
			hardBtn.className = 'active small';
			easyBtn.className = normalBtn.className = extremeBtn.className = 'small';
		}
	}

	function onExtremeBtn(e) {
		if (myMine.setDifficulty(3)) {
			extremeBtn.className = 'active small';
			easyBtn.className = normalBtn.className = hardBtn.className = 'small';
		}
	}

	function onStyle1Btn(e) {
		if (myMine.setStyle(0)) {
			style1Btn.className = 'active small';
			style2Btn.className = style3Btn.className = 'small';
		}
	}

	function onStyle2Btn(e) {
		if (myMine.setStyle(1)) {
			style2Btn.className = 'active small';
			style1Btn.className = style3Btn.className = 'small';
		}
	}

	function onStyle3Btn(e) {
		if (myMine.setStyle(2)) {
			style3Btn.className = 'active small';
			style1Btn.className = style2Btn.className = 'small';
		}
	}

	/*
	 * shows or hides the submit form
	 */
	function showScoreForm(show) {
		if (show) {
			document.getElementById("msscore").firstChild.nodeValue = myMine.getScore();
			document.getElementById("mssettings").style.display = 'none';
			document.getElementById("msform").style.display = 'inline';
		} else {
			document.getElementById("mssettings").style.display = 'inline';
			document.getElementById("msform").style.display = 'none';
		}
	}

	/*
	 * adds necessary form nodes containing score and time
	 */
	function onSubmit(e) {
		var input1, input2;

		// append score to form
		input1 = document.createElement("input");
		input1.setAttribute("type", "hidden");
		input1.setAttribute("name", "difficulty");
		input1.setAttribute("value", myMine.getDifficulty());
		scoreForm.appendChild(input1);

		// append score to form
		input2 = document.createElement("input");
		input2.setAttribute("type", "hidden");
		input2.setAttribute("name", "score");
		input2.setAttribute("value", myMine.getScore());
		scoreForm.appendChild(input2);

		return true;
	}
}

if (window.addEventListener) {
	window.addEventListener("load", function() { myGame = new game(); }, false);
} else {
	alert("Error initializing game.");
}

