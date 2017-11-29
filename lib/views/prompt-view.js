"use strict";

const {TextEditor} = require("atom");


class PromptView{
	
	constructor(opts = {}){
		const {
			headerClass = "prompt-header",
			footerClass = "prompt-footer",
		} = opts;
		
		// Setup DOM
		this.headerElement = document.createElement("div");
		this.footerElement = document.createElement("div");
		this.inputField    = new TextEditor({mini: true, softTabs: false});
	}
}


module.exports = PromptView;
