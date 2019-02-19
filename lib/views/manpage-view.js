"use strict";

const {TTYRenderer, parseManURL} = require("roff");
const {debounce, getManAdapter, getGrogAdapter, getGroffAdapter} = require("../utils.js");
const {CompositeDisposable, Disposable, Emitter} = require("atom");


/**
 * Class which displays rendered previews of Roff documents.
 * @internal
 * @class
 */
class ManpageView{
	
	constructor(page = {}){
		this.renderer    = new TTYRenderer();
		this.disposables = new CompositeDisposable();
		this.emitter     = new Emitter();
		
		// Pane-item element (outermost container)
		this.element = document.createElement("div");
		this.element.className = "manpage-view native-key-bindings";
		this.element.tabIndex = -1;
		this.element.addEventListener("click", event => {
			if("A" === event.target.tagName && /^man:/.test(event.target.href)){
				const page = parseManURL(event.target.href);
				this.loadPage(page.name, page.section);
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		});
		
		// Element directly inside this.element which receives rendered HTML
		this.content = this.element.appendChild(document.createElement("pre"));
		this.disposables.add(
			atom.config.observe("editor.lineHeight", value => this.content.style.lineHeight = value),
			atom.config.observe("editor.fontFamily", value => this.content.style.fontFamily = value),
			atom.config.observe("editor.fontSize",   value => {
				this.content.style.fontSize = value + "px";
				this.render();
			})
		);
		
		// Re-render content when element is resized
		const onResize = debounce(this.render.bind(this));
		window.addEventListener("resize", onResize);
		this.disposables.add(new Disposable(() => 
			window.removeEventListener("resize", onResize)));
		
		this.name    = page.name    || "";
		this.section = page.section || "";
		this.loadPage(page.name, page.section);
	}
	
	
	static deserialize(attr){
		return new ManpageView(attr);
	}
	
	serialize(){
		return {
			deserializer: "ManpageView",
			filePath:     this.path,
			editorId:     this.editorId,
			name:         this.name,
			section:      this.section,
			title:        this.title,
		};
	}
	
	
	destroy(){
		this.emitter.emit("did-destroy");
		this.emitter.dispose();
		this.disposables.dispose();
		this.element.remove();
	}
	
	
	onDidChangeTitle(fn){
		return this.emitter.on("did-change-title", fn);
	}
	
	
	getIconName(){
		return "manpage";
	}
	
	
	getURI(){
		const frag = this.fragment ? "#" + this.fragment : "";
		return `man://${this.name}/${this.section}` + frag;
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
	
	
	
	async loadPage(name, section){
		if(!name) return;
		const man    = await getManAdapter();
		const paths  = await man.find(name, section);
		
		// Show an error if page couldn't be loaded
		if(!paths.length || !paths[0])
			return atom.notifications.addError(section
				? `No manual entry for ${name} in section ${section}`
				: `No manual entry for ${name}`);
		else{
			this.path    = paths[0];
			this.name    = name;
			this.section = section || this.sectionByFilename(this.path);
			this.emitter.emit("did-change-title");
			
			const grog   = await getGrogAdapter();
			this.source  = await man.load(this.path);
			this.options = await grog.guessOptions(this.source, "utf8");
			
			return this.render();
		}
	}
	
	
	async render(){
		if(!this.source) return;
		const groff  = await getGroffAdapter();
		const width  = Math.round(this.content.offsetWidth / atom.config.get("editor.fontSize") - 1);
		const source = this.renderer.process(await groff.format(this.source, "utf8", {
			pageWidth: width + "v",
			args:      [...this.options].pop().slice(1),
			raw:       true,
		}));
		if(source !== this.content.innerHTML){
			this.content.innerHTML = source;
			this.element.scrollTop = 0;
		}
	}
	
	
	/**
	 * Extract the section number from a man-page's path.
	 *
	 * @param {String} input
	 * @return {String}
	 * @internal
	 */
	sectionByFilename(input){
		input = input.replace(/\\/g, "/");
		
		// Extract from directory name if unambiguous
		if(/\/man\/man([0-9ln])\/[^\/]+$/.test(input))
			return RegExp.lastParen;
		
		else(/\.([0-9][^.\s\/]*|l|n)(?:\.[^0-9][^.\s\/]*)?$/.test(input))
			? RegExp.lastParen
			: "";
	}
}

module.exports = ManpageView;
