"use strict";

const {CompositeDisposable} = require("atom");
const {join, parse} = require("path");
const fs = require("fs");
const Groff = require("./lib/groff.js");


class LanguageRoff{
	
	activate(){
		this.disposables = new CompositeDisposable();
		
		// Register commands with Atom
		let selector = "atom-text-editor[data-grammar='text roff']";
		this.disposables.add(atom.commands.add(selector, {
			"language-roff:indent":  () => this.indent(),
			"language-roff:outdent": () => this.outdent()
		}));
		
		selector
			+= ", atom-text-editor[data-grammar='source pic']"
			+ ".tree-view .file > .manpage-icon[data-path], .tab > .manpage-icon[data-path]"
			+ ("1 2 3 4 5 6 7 8 9 chem man mdoc me ms n pic roff tr".split(/\s/)
				.map(ext => `, .tree-view .file > [data-path$=".${ext}"], .tab > [data-path$=".${ext}"]`)
				.join("\n"));
		
		this.disposables.add(atom.commands.add(selector, {
			"language-roff:save-as-dvi":            ev => this.save(ev, "dvi"),
			"language-roff:save-as-html":           ev => this.save(ev, "html"),
			"language-roff:save-as-pdf":            ev => this.save(ev, "pdf"),
			"language-roff:save-as-ps":             ev => this.save(ev, "ps"),
			"language-roff:save-as-ascii":          ev => this.save(ev, "ascii"),
			"language-roff:save-as-utf8":           ev => this.save(ev, "utf8"),
			"language-roff:save-as-dvi-landscape":  ev => this.save(ev, "dvi",  ["-P-l"]),
			"language-roff:save-as-pdf-landscape":  ev => this.save(ev, "pdf",  ["-P-l"]),
			"language-roff:save-as-ps-landscape":   ev => this.save(ev, "ps",   ["-P-l"]),
		}));
	}
	

	/** Free up memory when deactivating package */
	deactivate(){
		this.disposables.dispose();
		this.disposables = null;
	}
	
	
	/**
	 * Handle Roff-specific indentation.
	 * @private
	 */
	indent(){
		const ed = atom.workspace.getActiveTextEditor();
		
		ed.transact(100, () => {
			const tab = ed.getTabText();
			
			for(const range of ed.getSelectedBufferRanges()){
				const {start, end} = range;
				
				// No range selected; insert a single tab
				if(0 === start.compare(end)){
					const firstRange = [[start.row, 0], [start.row, 1]];
					let firstChar;
					
					// Check if cursor's sitting before a control character
					!start.column && (firstChar = ed.getTextInBufferRange(firstRange).match(/^[.']/))
						? ed.setTextInBufferRange(firstRange, firstChar + tab)
						: ed.setTextInBufferRange(range, tab);
				}
				
				// Indent each row this range covers
				else for(let {row} = start; row <= end.row; ++row){
					const range = [[row, 0], [row, 1]];
					const first = ed.getTextInBufferRange(range);
					const setTo = /^[.']/.test(first)
						? first + tab   // Control line
						: tab + first   // Normal line
					ed.setTextInBufferRange(range, setTo);
				}
			}
		});
	}
	
	
	/**
	 * Handle Roff-specific unindentation.
	 * @private
	 */
	outdent(){
		const ed = atom.workspace.getActiveTextEditor();
		
		ed.transact(100, () => {
			const tab         = ed.getTabText();
			const untab       = "(?:\t|\\x20{1," + ed.getTabLength() + "})";
			const untabBefore = new RegExp("^" + untab, "g");
			const untabAfter  = new RegExp("(^[.'])" + untab, "g");
			
			for(const range of ed.getSelectedBufferRanges()){
				const {start, end} = range;
				
				for(let {row} = start; row <= end.row; ++row){
					const range = [[row, 0], [row, tab.length + 1]];
					const first = ed.getTextInBufferRange(range);
					
					// Control line
					if(/^[.']/.test(first))
						ed.setTextInBufferRange(range, first.replace(untabAfter, "$1"));
					
					// Normal line
					else if(/^\s/.test(first))
						ed.setTextInBufferRange(range, first.replace(untabBefore, ""));
				}
			}
		});
	}
	
	
	save(event, format, extraArgs = []){
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
		
		const target = this.getSaveLocation(inputPath, ext);
		if(!target) return;
		
		const args = {format, extraArgs, inputPath, outputPath: target};
		if(editor && !(inputPath && !editor.isModified() && fs.existsSync(inputPath)))
			args.inputData = editor.getText();
		
		return Groff.process(args).then(result => {
			const text = "Saved to `" + result.outputPath + "`";
			const note = atom.notifications.addSuccess(text, {dismissable: true});
			setTimeout(() => note.dismiss(), 2000);
		});
	}
	
	
	getSaveLocation(path, format){
		if(path){
			const {dir, name} = parse(path);
			path = join(dir, `${name}.${format}`);
		}
		else if(path = atom.project.getPaths()[0])
			path = join(path, "Untitled." + format);
		
		return atom.applicationDelegate.showSaveDialog({defaultPath: path});
	}
}

module.exports = new LanguageRoff();
