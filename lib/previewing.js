"use strict";

const {Disposable} = require("atom");
const fs           = require("fs");
const fontStyles   = require.resolve("urw-core35-fonts/index.css");
const {getManpagePrompt, getPageLoader} = require("./utils.js");


module.exports = () => [
	attachStyleSheet(fontStyles),
	
	atom.workspace.addOpener(uri => {
		const page = PageReference.fromURL(uri);
		if(null !== page)
			return getPageLoader().locate(...page).then(path => {
				return atom.workspace.open(page.toURL());
			});
	}),
	
	atom.commands.add("body", {
		"language-roff:open-manpage":      () => runOpenCmd(),
		"language-roff:search-manpages":   () => runSearchCmd(),
		"language-roff:clear-cached-data": () => runClearCmd(),
	}),
];


/**
 * Attach an external stylesheet to the workspace.
 *
 * @param {String} href - Path to CSS file
 * @param {Element} [parentElement] - DOM node to add <link> to
 * @return {Disposable} Removes stylesheet from DOM when disposed
 */
function attachStyleSheet(href, parentElement = null){
	const link = document.createElement("link");
	link.href  = href;
	link.rel   = "stylesheet";
	link.type  = "text/css";
	
	(parentElement = parentElement || document.querySelector("atom-styles"))
		? parentElement.insertBefore(link, parentElement.firstChild)
		: document.head.appendChild(link);
	
	return new Disposable(() => {
		if({parentElement} = link)
			parentElement.removeChild(link);
	});
}


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
	if(!atom.config.get("language-roff:disable-man-cache"))
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
	const input = await getManpagePrompt().promptUser({
		headerText: "Enter the name of a manual-page",
		footerHTML: "E.g., <code>perl</code>, <code>5 grep</code>, <code>grep(5)</code>",
	});
	if(!input) return;
	const page = PageReference.resolve(...String(input).trim().split(/\s+/g));
	const path = await getManpageLoader().locate(page.name, page.section);
	return path
		? atom.workspace.open(page.toURL())
		: notifyNothingMatched(page.name, page.section);
}


/**
 * Flush all cached lookups and loaded file data.
 * @internal
 */
function runClearCmd(){
	const {size} = manCache;
	manCache.clear();
	const plural = size !== 1 ? "s" : "";
	const message = `Cleared ${size} object${plural} from cache.`;
	atom.notifications.addInfo(message, {dismissable: true});
}
