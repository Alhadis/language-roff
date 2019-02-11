"use strict";

let promptView = null;
let manAdapter = null;
let groffAdapter = null;


module.exports = {

	/**
	 * Retrieve adapter instance for integrating with man(1).
	 *
	 * @return {ManAdapter}
	 * @internal
	 */
	async getManAdapter(){
		if(null === manAdapter){
			const {ManAdapter} = require("roff");
			manAdapter = await ManAdapter.loadDefault();
		}
		return manAdapter;
	},
	
	
	/**
	 * Retrieve adapter instance for integrating with groff(1).
	 *
	 * @return {GroffAdapter}
	 * @internal
	 */
	async getGroffAdapter(){
		if(null === groffAdapter){
			const {GroffAdapter} = require("roff");
			try{ groffAdapter = await GroffAdapter.loadDefault(); }
			catch(error){
				const text = "Unable to initialise Groff adapter.";
				console.error(error);
				
				// Assume Windows users haven't installed Groff yet
				if("win32" === process.platform){
					const url = "https://www.gnu.org/software/groff/#downloading";
					error = "[Download](" + url + ") and install Groff, then restart Atom.";
				}
				atom.notifications.addError(text, {description: error, dismissable: true});
			}
		}
		return groffAdapter;
	},
	
	
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
