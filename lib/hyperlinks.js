"use strict";

const {Disposable} = require("atom");
const OPTION_NAME = "language-roff.linkManPageReferences";


module.exports = () => [
	attachClickHandler(),
	atom.config.observe(OPTION_NAME, value =>
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
	if(!atom.config.get(OPTION_NAME))                      return; // User's disabled man-links
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
			atom.workspace.open(pageURL, {split: "right"});
		}
		return false;
	}
}
