"use strict";

const {join, parse} = require("path");
const {readFileSync, writeFileSync} = require("fs");
const {TTYRenderer, parseManURL} = require("roff");
const {debounce, getManAdapter, getGroffAdapter} = require("../utils.js");
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
			const selector = "a[href^='man:']";
			const link = event.target.matches(selector) ? event.target : event.target.closest(selector);
			if(link){
				const page = parseManURL(link.href);
				this.loadPage(page.name, page.section);
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		});
		
		// Element directly inside this.element which receives rendered HTML
		this.content = this.element.appendChild(document.createElement("pre"));
		this.disposables.add(
			atom.commands.add(this.element, {
				"language-roff:select-all":   this.selectAll.bind(this),
				"language-roff:edit-source":  this.openInEditor.bind(this),
				"language-roff:save-as-html": this.saveAsHTML.bind(this),
				"language-roff:save-as-utf8": this.saveAsText.bind(this),
			}),
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
			this.source  = await man.load(this.path);
			return this.render();
		}
	}
	
	
	async render(){
		if(!this.source) return;
		const groff  = await getGroffAdapter();
		const width  = Math.round(this.content.offsetWidth / atom.config.get("editor.fontSize") - 1);
		const source = this.renderer.process(await groff.format(this.source, "utf8", {
			pageWidth: width + "v",
			auto:      true,
			raw:       true,
		}));
		if(source !== this.content.innerHTML){
			this.content.innerHTML = source;
			this.element.scrollTop = 0;
		}
	}
	
	
	async openInEditor(){
		if(!this.path) return;
		return atom.workspace.open(this.path, {searchAllPanes: true});
	}
	
	
	/**
	 * Save the rendered man-page as monospaced HTML.
	 * @return {Promise<Notification>}
	 * @internal
	 */
	async saveAsHTML(){
		const location = await this.getSaveLocation(".html");
		if(!location) return;
		
		const viewStyle = window.getComputedStyle(this.element);
		const pageStyle = window.getComputedStyle(this.content);
		const source    = readFileSync(join(__dirname, "template.html"), "utf8")
			.replace(/%TITLE%/g,   parse(location).name)
			.replace(/%BG%/g,      viewStyle.backgroundColor)
			.replace(/%FG%/g,      pageStyle.color)
			.replace(/%SIZE%/g,    atom.config.get("editor.fontSize") + "px")
			.replace(/%LEADING%/g, atom.config.get("editor.lineHeight"))
			.replace(/%FAMILY%/g,  atom.config.get("editor.fontFamily"))
			.replace(/%CONTENT%/g, this.content.innerHTML);
		return this.saveFile(location, source);
	}
	
	
	/**
	 * Save the rendered man-page as UTF8-encoded plain text.
	 * @return {Promise<Notification>}
	 * @internal
	 */
	async saveAsText(){
		const location = await this.getSaveLocation(".txt");
		if(!location) return;
		return this.saveFile(location, this.content.textContent);
	}
	
	
	/**
	 * Write a string to disk, and display a notification when successful.
	 *
	 * @param {String} location - Location to write to
	 * @param {String} input - File content to be written
	 * @return {Promise<Notification>}
	 * @internal
	 */
	async saveFile(location, input){
		try{
			writeFileSync(location, input, "utf8");
			const text = "Saved to `" + location + "`";
			const note = atom.notifications.addSuccess(text, {dismissable: true});
			setTimeout(() => note.dismiss(), 2000);
			return note;
		}
		catch(error){
			return atom.notifications.addError(error.message, {
				detail: error.stack,
				dismissable: true,
			});
		}
	}
	
	
	/**
	 * Prompt the user for a location to save to.
	 *
	 * @param {String} suffix - File extension with leading dot
	 * @return {Promise<String>}
	 * @internal
	 */
	async getSaveLocation(suffix = ""){
		const {name, section} = this;
		const filename    = (name && section ? `${name}.${section}${suffix}` : name) || `Untitled${suffix}`;
		const defaultPath = join(atom.project.getPaths()[0] || require("os").homeDir(), filename);
		return atom.applicationDelegate.showSaveDialog({defaultPath});
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
		if(/\/man\/man([0-9ln])\/[^/]+$/.test(input))
			return RegExp.lastParen;
		
		else(/\.([0-9][^.\s/]*|l|n)(?:\.[^0-9][^.\s/]*)?$/.test(input))
			? RegExp.lastParen
			: "";
	}
	
	
	/**
	 * Intercept `core:select-all` to stop user selecting the entire workspace.
	 *
	 * @param {CustomEvent} event
	 * @return {Boolean} Returns false.
	 * @internal
	 */
	selectAll(event){
		event.preventDefault();
		event.stopPropagation();
		if(this.loading) return false;
		
		const selection = window.getSelection();
		selection.removeAllRanges();
		const range = document.createRange();
		range.selectNodeContents(this.element);
		selection.addRange(range);
		return false;
	}
}

module.exports = ManpageView;
