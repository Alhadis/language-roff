"use strict";

const {exec, New, resolveManRef} = require("./utils.js");
const fontStyles   = require.resolve("urw-core35-fonts/index.css");
const PromptView   = require("./views/prompt-view.js");
const {Disposable} = require("atom");
const fs           = require("fs");

const clearCache   = "clear-cached-data";
const manCache     = new Map();
let usingCache     = false;
let promptView     = null;


module.exports = () => [
	attachStyleSheet(fontStyles),
	
	// Syntax: man://[editor:id@]name/1#fragment
	atom.workspace.addOpener(uri => {
		const match = uri.match(/^man:\/\/([^\/#]+)\/?(\d+[-\w]*)?\/?(?:#(.*))?$/i)
		
		if(null !== match){
			const [_, name, section, fragment=""] = match;
			getManpagePath(name, section).then(path => {
				if(!path)
					return notifyNothingMatched(name, section);
				const src = fs.readFileSync(path, "utf8");
				console.log(src);
			});
		}
	}),
	
	atom.commands.add("body", {
		"language-roff:open-manpage":    () => runOpenCmd(),
		"language-roff:search-manpages": () => runSearchCmd(),
		[`language-roff:${clearCache}`]: () => runClearCmd(),
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
	const linkElement = New("link", {href, rel: "stylesheet", type: "text/css"});
	
	(parentElement = parentElement || document.querySelector("atom-styles"))
		? parentElement.insertBefore(linkElement, parentElement.firstChild)
		: document.head.appendChild(linkElement);
	
	return new Disposable(() => {
		if({parentElement} = linkElement)
			parentElement.removeChild(linkElement);
	});
}


/**
 * Ascertain the path to a manual-page.
 *
 * @param {String} name
 * @param {String} [section]
 * @param {Boolean} [all=false]
 * @return {Promise} Resolves to the manpage's full pathname.
 */
function getManpagePath(name, section = "", all = false){
	const pageKey = String(name) + section ? `(${section})` : "";
	let paths;
	usingCache = false;
	
	if(paths = manCache.get(pageKey)){
		usingCache = true;
		return Promise.resolve(all ? paths.slice() : paths[0]);
	}
	else return new Promise(resolve => {
		const argv = [name.replace(/^-/, "\\-")];
		if(section) 
			argv.unshift(section);
		
		exec("man", ["-aw", ...argv]).then(result => {
			paths = result.stdout.trim().split(/\n+/g);
			manCache.set(pageKey, paths);
			resolve(all ? paths.slice() : paths[0]);
		});
	});
}


/**
 * Retrieve the view for querying users for their input.
 *
 * @return {PromptView}
 * @internal
 */
function getManpagePrompt(){
	if(null === promptView)
		promptView = new PromptView({
			headerTagName: "label",
			headerClass: "prompt-header manpage-icon icon icon-book",
			footerClass: "prompt-footer message",
		});
	return promptView;
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
	if(usingCache)
		options.description = "The result of this lookup was cached from an earlier call."
			+ " If you believe this to be an error, clear the cache using the"
			+ " `language-roff:" + clearCache + "` command, then try again.";
	return atom.notifications.addError(message, options);
}


/**
 * Handler for the "open manual-page" command.
 *
 * @internal
 * @return {Promise}
 */
function runOpenCmd(){
	return getManpagePrompt().promptUser({
		headerText: "Enter the name of a manual-page",
		footerHTML: "E.g., <code>perl</code>, <code>5 grep</code>, <code>grep(5)</code>",
	}).then(input => {
		console.log(`Output: ${input}`);
		if(!input) return;
		input = String(input).trim().split(/\s+/g);
		const [name, section] = resolveManRef(...input);
		return getManpagePath(name, section).then(path => {
			
			// No manual entry found
			if(path){
				const uri = `man://${name}/${section}`;
				return atom.workspace.open(uri);
			}
			else notifyNothingMatched(name, section);
		});
	});
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
