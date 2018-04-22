var myShare;

/*
 * This function initializes an object which handles popups
 */
function popup(linkId, width, height, scrollbars) {
	var wnd, element;
	wnd = null;

	if ((document.getElementById) && (document.getElementById(linkId))) {
		element = document.getElementById(linkId);
		element.onclick = onClick;
	}

	function onClick() {
		var p, s;

		if ((wnd != null) && (wnd.closed)) {
			wnd = null;
		}
		if (wnd == null) {
			s = (scrollbars) ? "1" : "0";
			p = "width="+width+",height="+height+",status=0,"
			                 +"toolbar=0,scrollbars="+s+",resizable=0";
			wnd = "test";
			wnd = window.open(element.href, element.title, p);
		}
		if (window.focus) {
			wnd.focus();
		}
		return false;
	}
}

function addLoadEvent(func) { 
	var oldonload = window.onload;

	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
				if (oldonload) { 
					oldonload(); 
				} 
				func();
			};
	}
}

function initMyShare() {
	if ((document.getElementById) && (document.getElementById("myshare"))) {
		myShare = new Array(3);
		myShare[0] = new popup("sfacebook",   626, 436, false);
		myShare[1] = new popup("sgoogle",     626, 436, false);
		myShare[2] = new popup("sstumble",    626, 436, false);
	}
}

// this will make id="share*"-links open in a popup
addLoadEvent(initMyShare);

