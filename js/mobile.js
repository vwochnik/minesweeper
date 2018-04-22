var myGame;

function game() {
	var myMine, myHowtoPopup, gameState, scoreForm;
	var gameBtn, size1Btn, size2Btn, size3Btn, size4Btn,
	    easyBtn, normalBtn, hardBtn, extremeBtn,
	    style1Btn, style2Btn, style3Btn, okBtn;
	var playing = false; // if true, when clicked on smiley, then no settings

	function init() {
		myHowtoPopup = new popup("howtolink", 392, 522, true);

		if ((document.getElementById) && (document.addEventListener) &&
		    (window.addEventListener)) {
			// get buttons
			gameBtn = document.getElementById("msgamebtn");
			size1Btn = document.getElementById("mssize1btn");
			size2Btn = document.getElementById("mssize2btn");
			size3Btn = document.getElementById("mssize3btn");
			size4Btn = document.getElementById("mssize4btn");
			easyBtn = document.getElementById("mseasybtn");
			normalBtn = document.getElementById("msnormalbtn");
			hardBtn = document.getElementById("mshardbtn");
			extremeBtn = document.getElementById("msextremebtn");
			style1Btn = document.getElementById("msstyle1btn");
			style2Btn = document.getElementById("msstyle2btn");
			style3Btn = document.getElementById("msstyle3btn");
			okBtn = document.getElementById("msokbtn");
			scoreForm = document.getElementById('msscoreform');

			// associate events
			if ((gameBtn) && (size1Btn) && (size2Btn) && (size3Btn) && (size4Btn) && 
			    (easyBtn) && (normalBtn) && (hardBtn) && (extremeBtn) && (style1Btn) &&
			    (style2Btn) && (style3Btn) && (okBtn)) {
				gameBtn.addEventListener("click", onGameBtn, false);
				size1Btn.addEventListener("click", onSize1Btn, false);
				size2Btn.addEventListener("click", onSize2Btn, false);
				size3Btn.addEventListener("click", onSize3Btn, false);
				size4Btn.addEventListener("click", onSize4Btn, false);
				easyBtn.addEventListener("click", onEasyBtn, false);
				normalBtn.addEventListener("click", onNormalBtn, false);
				hardBtn.addEventListener("click", onHardBtn, false);
				extremeBtn.addEventListener("click", onExtremeBtn, false);
				style1Btn.addEventListener("click", onStyle1Btn, false);
				style2Btn.addEventListener("click", onStyle2Btn, false);
				style3Btn.addEventListener("click", onStyle3Btn, false);
				okBtn.addEventListener("click", onOkBtn, false);
				if (scoreForm) {
					scoreForm.addEventListener("submit", onSubmit, false);
				}
			}

			// resize event
			window.addEventListener("resize", onResize, false);
			if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {
				window.addEventListener("orient", onResize, false);
			}

			// initialize game object
			onResize(); // first set canvas size <dirty>
			setGameState('ingame');
			myMine = new Minesweeper();

			// attach events
			myMine.onNewGame = function() { playing = false; };
			myMine.onStartGame = function() { playing = true; };
			myMine.onGameOver = function() { playing = true; };
			myMine.onFinished = function() { playing = false; setGameState('form'); };

			// start new game
			myMine.setStyle(0, false);
			myMine.newGameScale(9);
			myMine.setDifficulty(1);
			size2Btn.className = 'active small';
			normalBtn.className = 'active small';
			style1Btn.className = 'active small';
		}
	}

	init();

	/*
	 * site state
	 */
	function setGameState(s) {
		gameState = s;
		if (s == 'ingame') {
			document.getElementById("msbtn").className = 'ingame';
			document.getElementById("mstime").className = 'ingame';
			document.getElementById("mswrapper").style.display = 'block';
			document.getElementById("mssettings").style.display = 'none';
			document.getElementById("msform").style.display = 'none';
		} else {
			document.getElementById("msbtn").className = '';
			document.getElementById("mstime").className = '';
			document.getElementById("mswrapper").style.display = 'none';

			if (s == 'form') {
				document.getElementById("msscore").firstChild.nodeValue = myMine.getScore();
				document.getElementById("mssettings").style.display = 'none';
				document.getElementById("msform").style.display = 'inline';
			} else {
				document.getElementById("mssettings").style.display = 'inline';
				document.getElementById("msform").style.display = 'none';
			}
		}
	}

	function onGameBtn(e) {
		if ((gameState != 'settings') && (!playing)) {
			myMine.newGame();
			setGameState('settings');
		} else {
			if (playing) {
				myMine.newGame();
			}
			setGameState('ingame');
		}
	}

	function onSize1Btn(e) {
		myMine.newGameScale(6);
		size1Btn.className = 'active small';
		size2Btn.className = size3Btn.className = size4Btn.className = 'small';
	}

	function onSize2Btn(e) {
		myMine.newGameScale(9);
		size2Btn.className = 'active small';
		size1Btn.className = size3Btn.className = size4Btn.className = 'small';
	}

	function onSize3Btn(e) {
		myMine.newGameScale(12);
		size3Btn.className = 'active small';
		size1Btn.className = size2Btn.className = size4Btn.className = 'small';
	}

	function onSize4Btn(e) {
		myMine.newGameScale(16);
		size4Btn.className = 'active small';
		size1Btn.className = size2Btn.className = size3Btn.className = 'small';
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

	function onOkBtn(e) {
		setGameState('ingame');
	}

	function onResize(e) {
		var w = document.getElementById("mswrapper");
		var c = document.getElementById("mscanvas");

		if ((c) && (c)) {
			c.width = w.clientWidth;
			c.height = w.clientWidth;
		}

		if (myMine) {
			myMine.refreshDimensions();
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

