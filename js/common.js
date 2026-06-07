let myShare;

/*
 * This class handles popups
 */
class Popup {
	constructor(linkId, width, height, scrollbars) {
		this.width = width;
		this.height = height;
		this.scrollbars = scrollbars;
		this.wnd = null;
		this.element = null;

		if (document.getElementById && document.getElementById(linkId)) {
			this.element = document.getElementById(linkId);
			this.element.onclick = () => this.onClick();
		}
	}

	onClick() {
		if (this.wnd !== null && this.wnd.closed) {
			this.wnd = null;
		}
		if (this.wnd === null) {
			const s = this.scrollbars ? "1" : "0";
			const p = `width=${this.width},height=${this.height},status=0,` +
				`toolbar=0,scrollbars=${s},resizable=0`;
			this.wnd = window.open(this.element.href, this.element.title, p);
		}
		if (window.focus) {
			this.wnd.focus();
		}
		return false;
	}
}

function addLoadEvent(func) {
	const oldonload = window.onload;

	if (typeof window.onload !== "function") {
		window.onload = func;
	} else {
		window.onload = () => {
			if (oldonload) {
				oldonload();
			}
			func();
		};
	}
}

function initMyShare() {
	if (document.getElementById && document.getElementById("myshare")) {
		myShare = [
			new Popup("sfacebook", 626, 436, false),
			new Popup("sgoogle", 626, 436, false),
			new Popup("sstumble", 626, 436, false),
		];
	}
}

// this will make id="share*"-links open in a popup
addLoadEvent(initMyShare);
