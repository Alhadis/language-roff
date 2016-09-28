"use strict";

const {CompositeDisposable} = require("atom");


class LanguageRoff{
	
	activate(){
		this.disposables = new CompositeDisposable();
		
		/** Register commands with Atom */
		const selector =
			"atom-text-editor[data-grammar^='text roff']," +
			"atom-text-editor[data-grammar^='text runoff']";
		
		this.disposables.add(atom.commands.add(selector, "language-roff:indent",  _=> this.indent()));
		this.disposables.add(atom.commands.add(selector, "language-roff:outdent", _=> this.outdent()));
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
				
				/** No range selected; insert a single tab */
				if(0 === start.compare(end)){
					const firstRange = [[start.row, 0], [start.row, 1]];
					let firstChar;
					
					/** Check if cursor's sitting before a control character */
					!start.column && (firstChar = ed.getTextInBufferRange(firstRange).match(/^[.']/))
						? ed.setTextInBufferRange(firstRange, firstChar + tab)
						: ed.setTextInBufferRange(range, tab);
				}
				
				/** Indent each row this range covers */
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
			const untabAfter  = new RegExp("(?<=^[.'])" + untab, "g");
			
			for(const range of ed.getSelectedBufferRanges()){
				const {start, end} = range;
				
				for(let {row} = start; row <= end.row; ++row){
					const range = [[row, 0], [row, tab.length + 1]];
					const first = ed.getTextInBufferRange(range);
					
					/** Control line */
					if(/^[.']/.test(first))
						ed.setTextInBufferRange(range, first.replace(untabAfter, ""));
					
					/** Normal line */
					else if(/^\s/.test(first))
						ed.setTextInBufferRange(range, first.replace(untabBefore, ""));
				}
			}
		});
	}
}

module.exports = new LanguageRoff();
