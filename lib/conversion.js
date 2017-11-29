"use strict";

const {existsSync}     = require("fs");
const {join, parse}    = require("path");
const {exec, readFile} = require("./utils.js");


/**
 * Register commands for processing/converting Roff documents.
 * @return {Disposable[]}
 * @private
 */
module.exports = () => [
	atom.commands.add(buildSelector(), {
		"language-roff:save-as-dvi":            ev => save(ev, "dvi"),
		"language-roff:save-as-html":           ev => save(ev, "html"),
		"language-roff:save-as-pdf":            ev => save(ev, "pdf"),
		"language-roff:save-as-ps":             ev => save(ev, "ps"),
		"language-roff:save-as-ascii":          ev => save(ev, "ascii"),
		"language-roff:save-as-utf8":           ev => save(ev, "utf8"),
		"language-roff:save-as-dvi-landscape":  ev => save(ev, "dvi",  ["-P-l"]),
		"language-roff:save-as-pdf-landscape":  ev => save(ev, "pdf",  ["-P-l"]),
		"language-roff:save-as-ps-landscape":   ev => save(ev, "ps",   ["-P-l"]),
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
 * @param {String} format - Lowercased name of format being saved to
 * @param {String[]} [extraArgs] - Additional arguments passed to Groff
 * @private
 */
function save(event, format, extraArgs = []){
	let inputPath, editor = null;
	
	if(event.target.matches("atom-text-editor, atom-text-editor *")){
		editor = atom.workspace.getActiveTextEditor();
		inputPath = editor.getPath();
	}
	else inputPath = event.target.dataset.path;
	
	let ext = format;
	if(format === "utf8" || format === "ascii"){
		extraArgs.push("-P-biuc");
		ext = "txt";
	}
	
	const target = getSaveLocation(inputPath, ext);
	if(!target) return;
	
	const args = {format, extraArgs, inputPath, outputPath: target};
	if(editor && !(inputPath && !editor.isModified() && existsSync(inputPath)))
		args.inputData = editor.getText();
	
	return convert(args).then(result => {
		const text = "Saved to `" + result.outputPath + "`";
		const note = atom.notifications.addSuccess(text, {dismissable: true});
		setTimeout(() => note.dismiss(), 2000);
	});
}


/**
 * Prompt the user for a system path to save to.
 * 
 * @param {String} path
 * @param {String} format
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


/**
 * Pipe a file's contents to Groff and write the output to disk.
 * 
 * @param {Object} args
 * @return {Promise}
 * @private
 */
function convert(args = {}){
	const {
		format     = "ps",
		extraArgs  = [],
		inputPath  = "",
		inputData  = "",
		outputPath = "",
		verbose    = false,
	} = args;
	
	return new Promise((resolve, reject) => {
		const args = [["-T" + format, inputData ? "-" : inputPath], inputData];
		
		exec("grog", ...args).then(result => {
			const {stdout, stderr} = result;
			
			// `grog` always exits with 0, even for missing files.
			if(stdout.match(/\n/g).length > 1){
				const [first, ...rest] = stdout.split(/\n/);
				const error = new Error(`grog: ${first}`);
				error.details = stderr + rest.join("\n");
				return reject(error);
			}
			
			const [exec, ...args] = stdout.split(/\s+/).filter(Boolean);
			
			// `grog` may miss preprocessor output
			if(args.length < 4){
				const tmacMatch = /^\.\\" (eqn|grap|chem|pic|refer|tbl)\.tmac$/m;
				if((inputData || readFile(inputPath)).match(tmacMatch)){
					const missingFlag = {
						eqn:   "-e",  pic:   "-p",
						grap:  "-G",  refer: "-R",
						chem:  "-j",  tbl:   "-t",
					}[RegExp.lastParen];
					args.unshift(missingFlag);
				}
			}
			args.unshift("-D", "utf8", ...extraArgs);
			
			return exec(exec, args, inputData, outputPath).then(result => {
				const {code, stdout, stderr} = result;
				if(!code){
					verbose && stderr && console.error(stderr);
					return resolve({stdout, outputPath});
				}
				else{
					const error = new Error(`${exec}: Exited with status ${code}`);
					error.code = code
					error.details = stderr;
					return reject(error);
				}
			});
		});
	});
}
