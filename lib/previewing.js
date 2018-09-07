"use strict";

const {Disposable}   = require("atom");
const fontStyles     = require.resolve("urw-core35-fonts/index.css");
const {getManPrompt} = require("./utils.js");
const {parseManURL}  = require("roff/lib/adapters/utils.js");


module.exports = () => [
	attachStyleSheet(fontStyles),
	
	atom.workspace.addOpener(uri => {
		const page = parseManURL(uri);
		if(null !== page)
			return; // TODO: Reconnect once adapters are finished
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
	const input = await getManPrompt().promptUser({
		headerText: "Enter the name of a manual-page",
		footerHTML: "E.g., <code>perl</code>, <code>5 grep</code>, <code>grep(5)</code>",
	});
	if(!input) return;
	const page = ManPageReference.resolve(...String(input).trim().split(/\s+/g));
	const path = await getPageLoader().locate(page.name, page.section);
	return path
		? atom.workspace.open((console.log(page), page.toURL()))
		: notifyNothingMatched(page.name, page.section);
}


/**
 * Handler for the "search manual-pages" command.
 *
 * @internal
 * @return {PromptView} which starts listing fuzzy-matched
 * search results as directories are found.
 */
async function runSearchCmd(){
	const input = await getManPrompt().promptUser({
		headerText: "Enter some keywords that describe what you're looking for",
		footerHTML: "E.g., block devices"
	});
	if(!input) return;
	return null;
	/*
		TODO: #1: Break the chunk of text `man -k' gives that looks like:

			alsaunmute (1)        - a simple script to initialize ALSA sound devices
			badblocks (8)         - search a device for bad blocks
			bcache-super-show (8) - Print the bcache superblock
			blkdeactivate (8)     - utility to deactivate block devices
			blkid (8)             - locate/print block device attributes
			blkmapd (8)           - pNFS block layout mapping daemon
			blockdev (8)          - call block device ioctls from the command line
			bridge (8)            - show / manipulate bridge addresses and devices
			btattach (1)          - attach serial devices to BlueZ stack
			btrfs-balance (8)     - balance block groups on a btrfs filesystem
			btrfs-device (8)      - manage devices of btrfs filesystems
			
		TODO #2:
			Make sure that parsing is somewhat reliable beteen platforms.
			Use the extracted `topic(section)' as a source of truth if all else fails.

		TODO #3:
			Set it so a user picking a selection has the page asynchronously
			loaded and opened in their workspace, consequently shutting the dialogue.
	*/
}


/**
 * Flush all cached lookups and loaded file data.
 * @internal
 */
async function runClearCmd(){
	const sharedCache = require("roff").sharedInstance;
	const {size} = sharedCache;
	sharedCache.clear();
	const plural = size !== 1 ? "s" : "";
	const message = `Cleared ${size} object${plural} from cache.`;
	atom.notifications.addInfo(message, {dismissable: true});
}
