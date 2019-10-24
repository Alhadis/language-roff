"use strict";

const {getManPrompt, getManAdapter} = require("./utils.js");
const {parseManURL} = require("roff");


module.exports = () => [
	atom.workspace.addOpener(uri => {
		const page = parseManURL(uri);
		if(null !== page)
			return new (require("./views/troff-view.js"))(page);
	}),
	
	atom.commands.add("body", {
		"language-roff:open-manpage":      () => runOpenCmd(),
		"language-roff:clear-cached-data": () => runClearCmd(),
	}),
];


/**
 * Display a notification indicating no entry was found for a queried topic.
 *
 * @param {String} name - Topic name
 * @param {String} [section=""] - Optional section name
 * @return {Notification}
 * @internal
 */
function notifyNothingMatched(name, section = ""){
	const message = section
		? `No manual entry found for \`${name}\` in section \`${section}\`.`
		: `No manual entry found for \`${name}\`.`;
	const options = {dismissable: true};
	options.description = "This lookup may have been cached from an earlier call."
		+ " If you believe this to be an error, clear the cache using the"
		+ " `language-roff:clear-cached-data` command, then try again.";
	return atom.notifications.addError(message, options);
}


/**
 * Handler for the "open manual-page" command.
 * @return {Notification}
 * @internal
 */
async function runOpenCmd(){
	let input = await getManPrompt().promptUser({
		headerText: "Enter the name of a manual-page",
		footerHTML: "E.g., <code>perl</code>, <code>5 grep</code>, <code>grep(5)</code>",
	});
	
	if(input && (input = input.split(/\s+/).filter(Boolean))[0]){
		const man   = await getManAdapter();
		const paths = await man.find(...input);
		paths[0]
			? atom.workspace.open(`man://${input.join("/")}`)
			: notifyNothingMatched(...input);
	}
}


/**
 * Flush all cached lookups and loaded file data.
 * @internal
 */
async function runClearCmd(){
	const man = await getManAdapter();
	const {size} = man.cache;
	man.cache.clear();
	const plural = size !== 1 ? "s" : "";
	const message = `Cleared ${size} object${plural} from cache.`;
	atom.notifications.addInfo(message, {dismissable: true});
}
