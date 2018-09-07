"use strict";

let promptView = null;


module.exports = {

	/**
	 * Retrieve view for querying users for input for man(1)-related commands.
	 *
	 * @return {PromptView}
	 * @internal
	 */
	getManPrompt(){
		if(null === promptView){
			const PromptView = require("prompt-view");
			promptView = new PromptView({
				headerTagName: "label",
				headerClass: "prompt-header manpage-icon icon icon-book",
				footerClass: "prompt-footer message",
			});
		}
		return promptView;
	},
};
