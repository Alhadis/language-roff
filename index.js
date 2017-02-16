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
		
		selector += ", atom-text-editor[data-grammar='source pic']";
		this.disposables.add(atom.commands.add(selector, {
			"language-roff:save-as-dvi":  () => this.saveEditor("dvi"),
			"language-roff:save-as-html": () => this.saveEditor("html"),
			"language-roff:save-as-pdf":  () => this.saveEditor("pdf"),
			"language-roff:save-as-ps":   () => this.saveEditor("ps")
		}));
		
		selector = ".tree-view .file > .manpage-icon[data-path], .tab > .manpage-icon[data-path]";
		for(const ext of "1 2 3 4 5 6 7 8 9 chem man mdoc me ms n pic roff tr".split(/\s/))
			selector += `, .tree-view .file > [data-path$=".${ext}"], .tab > [data-path$=".${ext}"]`;
		this.disposables.add(atom.commands.add(selector, {
			"language-roff:save-as-dvi":  ev => this.saveEntry(ev, "dvi"),
			"language-roff:save-as-html": ev => this.saveEntry(ev, "html"),
			"language-roff:save-as-pdf":  ev => this.saveEntry(ev, "pdf"),
			"language-roff:save-as-ps":   ev => this.saveEntry(ev, "ps")
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
	
	
	saveEditor(format, editor = null){
		editor = editor || atom.workspace.getActiveTextEditor();
		if(!editor) return;
		
		const path = editor.getPath();
		const target = this.getSaveLocation(path, format);
		if(!target) return;
		
		return path && !editor.isModified()
			? Groff.processFile(path, target, format)
			: Groff.processData(editor.getText(), target, format);
	}
	
	
	saveEntry(event, format){
		if(!(event.target && event.target.dataset)) return;
		const {path} = event.target.dataset;
		const target = this.getSaveLocation(path, format);
		if(!target) return;
		Groff.processFile(path, target, format);
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
