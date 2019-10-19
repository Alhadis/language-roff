"use strict";

const {Disposable}   = require("atom");
const canvasStyles   = require.resolve("roff/lib/postproc/canvas/viewer.css");
const fontStyles     = require.resolve("urw-core35-fonts/index.css");
const {getManPrompt, getManAdapter} = require("./utils.js");
const {parseManURL, resolveManRef} = require("roff");
const LINK_MAN_PAGES = "language-roff.linkManPageReferences";


module.exports = () => [
	attachClickHandler(),
	attachStyleSheet(fontStyles),
	attachStyleSheet(canvasStyles),
	
	atom.workspace.addOpener(uri => {
		const page = parseManURL(uri);
		if(null !== page)
			return new (require("./views/manpage-view.js"))(page);
	}),
	
	atom.commands.add("body", {
		"language-roff:open-manpage":      () => runOpenCmd(),
		"language-roff:clear-cached-data": () => runClearCmd(),
	}),
	
	atom.config.observe(LINK_MAN_PAGES, value =>
		document.body.classList.toggle("disable-manref-links", !value)),
];


/**
 * Attach a listener to intercept `click` events.
 *
 * @param {String} [eventType="pointerdown"]
 * @return {Disposable} Removes listener when disposed.
 */
function attachClickHandler(eventType = "pointerdown"){
	document.body.removeEventListener(eventType, handleClick);
	document.body.addEventListener(eventType, handleClick);
	return new Disposable(() =>
		document.body.removeEventListener(eventType, handleClick));
}


/**
 * Intercept a `click` event on a tokenised man-page reference.
 * 
 * @param {MouseEvent|PointerEvent} event
 * @this {HTMLBodyElement}
 * @internal
 */
function handleClick(event){
	let {target} = event;
	if(event.metaKey || event.ctrlKey || event.button > 0) return; // Respond to left-clicks only
	if(!atom.config.get(LINK_MAN_PAGES))                   return; // User's disabled man-links
	if("object" !== typeof target || !target.classList)    return; // Shouldn't happen
	
	if(target.classList.contains("syntax--manref") && target.closest("atom-text-editor")){
		event.preventDefault();
		event.stopImmediatePropagation();
		if("syntax--manref" !== target.className)
			target = target.closest("atom-text-editor [class='syntax--manref']");
		if(target){
			const subject = (target.querySelector(".syntax--subject") || {}).textContent || "";
			const section = (target.querySelector(".syntax--section") || {}).textContent || "";
			const pageURL = `man://${subject}/${section.replace(/^\(|\)$/g, "")}`;
			atom.workspace.open(pageURL);
		}
		return false;
	}
}


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
