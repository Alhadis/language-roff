"use strict";

const {existsSync}      = require("fs");
const {join, parse}     = require("path");
const {getGroffAdapter} = require("./utils.js");

// Preload adapter at startup to improve response time
require("roff").GroffAdapter.loadDefault();


/**
 * Register commands for processing/converting Roff documents.
 * @return {Disposable[]}
 * @internal
 */
module.exports = () => [
	atom.commands.add(buildSelector(), {
		"language-roff:save-as-dvi":            ev => save(ev, "dvi"),
		"language-roff:save-as-html":           ev => save(ev, "html"),
		"language-roff:save-as-pdf":            ev => save(ev, "pdf"),
		"language-roff:save-as-ps":             ev => save(ev, "ps"),
		"language-roff:save-as-ascii":          ev => save(ev, "ascii"),
		"language-roff:save-as-utf8":           ev => save(ev, "utf8"),
		"language-roff:save-as-dvi-landscape":  ev => save(ev, "dvi",  {landscape: true}),
		"language-roff:save-as-pdf-landscape":  ev => save(ev, "pdf",  {landscape: true}),
		"language-roff:save-as-ps-landscape":   ev => save(ev, "ps",   {landscape: true}),
	}),
];


/**
 * Construct the selector string for scoping conversion commands.
 * @return {String}
 * @private
 */
function buildSelector(){
	return "atom-text-editor[data-grammar='text roff']"
		+ ", atom-text-editor[data-grammar='source pic']"
		+ ", .tree-view .file > .manpage-icon[data-path], .tab > .manpage-icon[data-path]"
		+ ("1 2 3 4 5 6 7 8 9 chem man mdoc me ms n pic roff tr".split(/\s/)
			.map(ext => `, .tree-view .file > [data-path$=".${ext}"], .tab > [data-path$=".${ext}"]`)
			.join("\n"));
}


/**
 * Wrapper function which handles a specific "Save as…" command.
 * 
 * @param {CustomEvent} event - Object describing the triggered event
 * @param {String}     format - Lowercased name of format being saved to
 * @param {Object}  [options] - Parameters passed to {@link GroffAdapter#format}
 * @private
 */
async function save(event, format, options = {}){
	let editor = null;
	options = {...options};
	
	const groff = await getGroffAdapter();
	if(!groff) return;
	
	// macOS ships with Groff 1.19.2, which lacks a PDF driver
	if("pdf" === format && !groff.devices.pdf){
		const text = "PDF output not supported by Groff installation";
		let description = "Please upgrade Groff to the newest version, then restart Atom.";
		if("darwin" === process.platform) description += [,
			"You can install the latest Groff using [Homebrew](https://brew.sh/):",
			"~~~\nbrew install groff\n~~~",
		].join("\n\n");
		const note = atom.notifications.addError(text, {description, dismissable: true});
		console.log(note);
		return;
	}
	
	if(event.target.matches("atom-text-editor, atom-text-editor *")){
		editor = atom.workspace.getActiveTextEditor();
		options.inputFile = editor.getPath();
	}
	else options.inputFile = event.target.dataset.path;
	
	const ext = ("utf8" === format || "ascii" === format) ? "txt" : format;
	options.outputFile = getSaveLocation(options.inputFile, ext);
	if(!options.outputFile) return;
	
	let inputData = null;
	if(editor && !(options.inputFile && !editor.isModified() && existsSync(options.inputFile)))
		inputData = editor.getText();
	
	try{
		await groff.format(inputData, format, options);
		const text = "Saved to `" + options.outputFile + "`";
		const note = atom.notifications.addSuccess(text, {dismissable: true});
		setTimeout(() => note.dismiss(), 2000);
	}
	catch(error){
		atom.notifications.addError(error.message, {
			detail: error.stack,
			dismissable: true,
		});
	}
}


/**
 * Prompt the user for a system path to save to.
 * 
 * @param  {String} path
 * @param  {String} format
 * @return {String}
 */
function getSaveLocation(path, format){
	if(path){
		const {dir, name} = parse(path);
		path = join(dir, `${name}.${format}`);
	}
	else if(path = atom.project.getPaths()[0])
		path = join(path, "Untitled." + format);
	
	return atom.applicationDelegate.showSaveDialog({defaultPath: path});
}
