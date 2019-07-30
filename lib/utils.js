"use strict";

let promptView = null;
let manAdapter = null;
let groffAdapter = null;


module.exports = {
	
	/**
	 * Stop a function from firing too quickly.
	 *
	 * Returns a copy of the original function that runs only after the designated
	 * number of milliseconds have elapsed. Useful for throttling onResize handlers.
	 *
	 * @param {Function} fn - Function to debounce
	 * @param {Number} [limit=0] - Threshold to stall execution by, in milliseconds.
	 * @param {Boolean} [asap=false] - Call function *before* threshold elapses, not after.
	 * @return {Function}
	 */
	debounce(fn, limit = 0, asap = false){
		let started, context, args, timing;
		
		function delayed(){
			const timeSince = Date.now() - started;
			if(timeSince >= limit){
				if(!asap) fn.apply(context, args);
				if(timing) clearTimeout(timing);
				timing = context = args = null;
			}
			else timing = setTimeout(delayed, limit - timeSince);
		}
		
		// Debounced copy of original function
		return function(...args){
			context = this;
			if(!limit)
				return fn.apply(context, args);
			started = Date.now();
			if(!timing){
				if(asap) fn.apply(context, args);
				timing = setTimeout(delayed, limit);
			}
		};
	},
	
	
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
