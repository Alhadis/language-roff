"use strict";

const {TextEditor} = require("atom");
const currentPrompts = new WeakMap();


/**
 * Modal dialogue for asynchronously prompting users for their input.
 * TODO: Move this class to a separate module?
 * @class
 */
class PromptView{
	
	/**
	 * Instantiate a new {@link PromptView} instance.
	 * 
	 * @param {Object} [opts={}] - Initial property values
	 * @constructor
	 */
	constructor(opts = {}){
		
		// Setup DOM
		this.buildTree(opts);
		this.panel = atom.workspace.addModalPanel({visible: false, item: this});
		this.inputField.element.addEventListener("blur", () => this.confirm(null));
		atom.commands.add(this.inputField.element, {
			"core:confirm": () => this.confirm(this.input),
			"core:cancel":  () => this.confirm(null),
		});
		
		// Assign initial property values
		this.assignProps({
			elementClass: "prompt",
			headerClass:  "prompt-header",
			footerClass:  "prompt-footer",
		}, opts);
	}
	
	
	/**
	 * Construct the elements which compose the {@link PromptView}'s modal dialogue.
	 * 
	 * @returns {PromptView} Reference to the calling instance
	 * @internal
	 */
	buildTree(opts = {}){
		const {
			elementTagName = "div",
			headerTagName  = "header",
			footerTagName  = "footer",
		} = opts;
		
		/**
		 * @property {HTMLElement} element
		 * @description Top-level wrapper representing {@link PromptView} in Atom's workspace.
		 *
		 * @property {HTMLElement} headerElement
		 * @description Content block displayed above {@link #inputField}, empty unless
		 * {@link headerText} or {@link headerHTML} has been assigned content.
		 *
		 * @property {TextEditor} inputField
		 * @description Miniature editing bar where user types their input.
		 * 
		 * @property {HTMLElement} footerElement
		 * @description Content block displayed below {@link #inputField}, empty
		 * unless {@link headerText} or {@link headerHTML} have been assigned content.
		 */

		this.element       = document.createElement(elementTagName);
		this.headerElement = document.createElement(headerTagName);
		this.footerElement = document.createElement(footerTagName);
		this.inputField    = new TextEditor({mini: true, softTabs: false});
		this.element.append(...[
			this.headerElement,
			this.inputField.element,
			this.footerElement,
		]);
		return this;
	}
	
	
	/**
	 * Update the instance's properties using values extracted from objects.
	 *
	 * @example view.assignProps({headerText: "Hello, world"});
	 * @param {...Object} opts
	 * @return {PromptView}
	 */
	assignProps(...opts){
		opts = Object.assign({}, ...opts);
		
		// Delete anything which isn't assigned normally
		delete opts.elementTagName;
		delete opts.headerTagName;
		delete opts.footerTagName;
		
		Object.assign(this, opts);
		return this;
	}
	
	
	/**
	 * Present the dialogue to the user, resolving once they confirm an answer.
	 *
	 * @async
	 * @param {Object} [opts={}]
	 *    Instance properties to update.
	 * @return {Promise}
	 *    Resolves to a {@link String} containing the user's input, or
	 *    the `null` value if the prompt was cancelled for any reason.
	 * @example
	 *    <caption>A user is prompted and responds with <code>dd(1)</code></caption>
	 *    new PromptView().promptUser({
	 *        headerText: "Enter the name of a manual-page",
	 *        footerHTML: "E.g., <code>perl</code>, <code>grep(5)</code>",
	 *    }).then(response => "dd(1)");
	 * @public
	 */
	promptUser(opts = {}){
		
		// Return existing prompt which hasn't been confirmed yet
		const prompt = currentPrompts.get(this);
		if(prompt)
			return prompt.promise;
		
		// Otherwise, start a new one
		else{
			this.input = "";
			this.assignProps(this, opts);
			this.saveFocus();
			this.panel.show();
			this.inputField.element.focus();
			
			let handler = null;
			const promise = new Promise(fn => handler = fn);
			currentPrompts.set(this, {promise, handler});
			return promise;
		}
	}
	
	
	/**
	 * Confirm user's response and invoke any unresolved prompt-handler.
	 * 
	 * @param {String|null} input - Null values indicate cancelled prompts.
	 * @internal
	 */
	confirm(input){
		const prompt = currentPrompts.get(this);
		if(!prompt) return;
		currentPrompts.delete(this);
		
		this.input = "";
		this.panel.hide();
		this.restoreFocus();
		
		if("function" === typeof prompt.handler)
			prompt.handler.call(null, input);
	}
	
	
	/**
	 * Save whatever DOM element has user focus before displaying a dialogue.
	 * @internal
	 */
	saveFocus(){
		this.previouslyFocussedElement = document.activeElement || null;
	}
	
	
	/**
	 * Restore focus to whatever element was holding it at the time the PromptView
	 * has been open. If the original element no longer exists in the DOM, focus is
	 * shifted to {@link atom.workspace.element} as a last resort.
	 * @internal
	 */
	restoreFocus(){
		const el = this.previouslyFocussedElement;
		this.previouslyFocussedElement = null;
		(el && document.documentElement.contains(el))
			? el.focus()
			: atom.workspace.element.focus();
	}
	
	
	/**
	 * @property {String} input
	 * @description Text currently entered into the instance's {@link #inputField}.
	 * Writing to this property will replace whatever text has been entered in the field.
	 */
	get input(){
		return this.inputField
			? this.inputField.getText()
			: "";
	}
	set input(to){
		if(this.inputField)
			this.inputField.setText(to);
	}
	
	
	/**
	 * @readonly
	 * @property {String} [elementTagName="div"]
	 * @description Name of the HTML tag used to create {@link #headerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get elementTagName(){
		return this.element
			? this.element.tagName.toLowerCase()
			: "";
	}


	/**
	 * @property {String} elementClass
	 * @description List of CSS classes assigned to instance's wrapper {@link #element}.
	 */
	get elementClass(){
		return this.element
			? this.element.className
			: "";
	}
	set elementClass(to){
		if(this.element)
			this.element.className = to;
	}


	/**
	 * @readonly
	 * @property {String} [headerTagName="header"]
	 * @description Name of the HTML tag used to create {@link #headerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get headerTagName(){
		return this.headerElement
			? this.headerElement.tagName.toLowerCase()
			: "";
	}
	
	/**
	 * @property {String} headerClass
	 * @description List of CSS classes assigned to instance's {@link #headerElement}.
	 */
	get headerClass(){
		return this.headerElement
			? this.headerElement.className
			: "";
	}
	set headerClass(to){
		if(this.headerElement)
			this.headerElement.className = to;
	}
	
	
	/**
	 * @property {String} headerText
	 * @description A plain-text representation of the {@link #headerElement}'s content.
	 */
	get headerText(){
		return this.headerElement
			? this.headerElement.textContent
			: "";
	}
	set headerText(to){
		if(this.headerElement)
			this.headerElement.textContent = to;
	}
	
	
	/**
	 * @property {String} headerHTML
	 * @description HTML representation of the {@link #headerElement|header}'s contents.
	 */
	get headerHTML(){
		return this.headerElement
			? this.headerElement.innerHTML
			: "";
	}
	set headerHTML(to){
		if(this.headerElement)
			this.headerElement.innerHTML = to;
	}


	/**
	 * @readonly
	 * @property {String} [footerTagName="footer"]
	 * @description Name of the HTML tag used to create {@link #footerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get footerTagName(){
		return this.footerElement
			? this.footerElement.tagName.toLowerCase()
			: "";
	}


	/**
	 * @property {String} footerClass
	 * @description List of CSS classes assigned to instance's {@link #footerElement}.
	 */
	get footerClass(){
		return this.footerElement
			? this.footerElement.className
			: "";
	}
	set footerClass(to){
		if(this.footerElement)
			this.footerElement.className = to;
	}
	
	
	/**
	 * @property {String} footerText
	 * @description A plain-text representation of the {@link #footerElement}'s content.
	 */
	get footerText(){
		return this.footerElement
			? this.footerElement.textContent
			: "";
	}
	set footerText(to){
		if(this.footerElement)
			this.footerElement.textContent = to;
	}
	
	
	/**
	 * @property {String} footerHTML
	 * @description HTML representation of the {@link #footerElement|footer}'s contents.
	 */
	get footerHTML(){
		return this.footerElement
			? this.footerElement.innerHTML
			: "";
	}
	set footerHTML(to){
		if(this.footerElement)
			this.footerElement.innerHTML = to;
	}
}


module.exports = PromptView;
