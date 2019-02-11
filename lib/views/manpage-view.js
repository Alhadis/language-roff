"use strict";

const {TroffCanvasViewer, TTYViewer} = require("roff");
const {getManAdapter, getGrogAdapter, getGroffAdapter} = require("../utils.js");


/**
 * Wrapper class which displays rendered previews of Roff documents.
 * @internal
 * @class
 */
class ManpageView{
	
	constructor(page = {}){
		Object.assign(this, page);
		this.element    = document.createElement("div");
		this.canvasView = new TroffCanvasViewer({parentElement: this.element});
		this.ttyView    = new TTYViewer(document.createElement("pre"));
		this.ttyView.element.className = "troff-tty";
		
		let mode = "";
		Object.defineProperties(this, {
			currentView: {
				get: () => "canvas" === mode
					? this.canvasView
					: this.ttyView,
			},
			
			currentElement: {
				get: () => this.currentView.root || this.currentView.element,
			},
			
			mode: {
				get: () => mode,
				set: to => {
					if(mode === (to = to.trim().toLowerCase())) return;
					switch(to){
						case "canvas":
							this.ttyView.element.remove();
							this.element.appendChild(this.canvasView.root);
							mode = to;
							this.refresh();
							break;
						
						// FIXME: Nuke the entire TTYViewer class
						case "tty":
							this.canvasView.root.remove();
							this.element.appendChild(this.ttyView.element);
							mode = to;
							Object.assign(this.ttyView.element.style, {
								fontSize:   atom.config.get("editor.fontSize") + "px",
								fontFamily: atom.config.get("editor.fontFamily"),
								lineHeight: atom.config.get("editor.lineHeight"),
							});
							this.refresh();
							break;
					}
				},
			},
		});
		this.mode = "canvas";
	}
	
	
	getIconName(){
		return "manpage";
	}
	
	
	getURI(){
		const frag = this.fragment ? "#" + this.fragment : "";
		return `man://${this.topic}/${this.section}` + frag;
	}
	
	
	getTitle(){
		if(!this.name) return "Untitled";
		let title = this.name;
		if(this.section) title += `(${this.section})`;
		return title;
	}
	
	
	getPath(){
		return this.path || "";
	}
	
	
	async refresh(){
		const groff = await getGroffAdapter();
		
		if(groff){
			const grog   = await getGrogAdapter();
			const man    = await getManAdapter();
			this.path    = (await man.find(this.name, this.section))[0];
			this.source  = await man.load(this.path);
			const device = "canvas" === this.mode
				? groff.devices.pdf  ? "pdf"  : "ps"
				: groff.devices.utf8 ? "utf8" : "ascii";
			const tokens = await groff.format(this.source, device, {
				args: (await grog.guessOptions(this.source)).pop().slice(1),
				raw: true,
			});
			"canvas" === this.mode
				? this.currentView.load(tokens)
				: this.currentView.render(tokens);
		}
	}
}

module.exports = ManpageView;
