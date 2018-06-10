"use strict";

let promptView = null;
let pageLoader = null;


module.exports = {

	/**
	 * Retrieve the view for querying users for their input.
	 *
	 * @return {PromptView}
	 * @internal
	 */
	getManpagePrompt(){
		if(null === promptView){
			const PromptView = require("./views/prompt-view.js");
			promptView = new PromptView({
				headerTagName: "label",
				headerClass: "prompt-header manpage-icon icon icon-book",
				footerClass: "prompt-footer message",
			});
		}
		return promptView;
	},


	/**
	 * Return a shared instance of Roff.js's manpage loader.
	 *
	 * @return {ManPageLoader}
	 * @internal
	 */
	getPageLoader(){
		if(null === pageLoader){
			const {ManPageLoader} = require("roff");
			pageLoader = new ManPageLoader();
		}
		return pageLoader;
	},
};
