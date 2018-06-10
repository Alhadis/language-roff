"use strict";

/**
 * Register commands for editing Roff source.
 * @return {Disposable[]}
 * @internal
 */
module.exports = () => [
	atom.commands.add("atom-text-editor[data-grammar='text roff']", {
		"language-roff:fix-blank-lines": () => fixBlankLines(),
		"language-roff:indent":          () => indentEditor(),
		"language-roff:outdent":         () => outdentEditor(),
	}),
];


/**
 * Replace blank Roff lines with empty requests.
 *
 * @example "\n\n" => "\n.\n"
 * @internal
 */
function fixBlankLines(){
	const settingName = "language-roff.blankLineReplacement";
	const replacement = atom.config.get(settingName) || ".";
	
	replaceInEditor(/^[ \t]*$/gm, match => {
		const {range, replace} = match;
		const {scopes} = ed.scopeDescriptorForBufferPosition(range.start);
		if(-1 === scopes.indexOf("comment.block.ignored-input.roff")
		&& -1 === scopes.indexOf("meta.function.definition.request.de.roff")
		&& -1 === scopes.indexOf("meta.function.definition.request.am.roff")
		&& -1 === scopes.indexOf("string.unquoted.roff"))
			replace(replacement);
	});
}


/**
 * Handle Roff-specific indentation.
 * @internal
 */
function indentEditor(){
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
					: tab + first;  // Normal line
				ed.setTextInBufferRange(range, setTo);
			}
		}
	});
}


/**
 * Handle Roff-specific unindentation.
 * @internal
 */
function outdentEditor(){
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



/**
 * Perform a search-and-replace on an editor's selections.
 *
 * If nothing's selected, the entire buffer is targeted.
 *
 * @param {RegExp} pattern
 * @param {Function} iterator
 * @param {TextEditor} [editor=null]
 * @public
 */
function replaceInEditor(pattern, iterator, editor = null){
	editor = editor || atom.workspace.getActiveTextEditor();
	if(!editor) return;
	
	editor.transact(100, () => {
		editor.getSelectedText()
			? editor.getSelections().forEach(selection => {
				const range = selection.getBufferRange();
				editor.scanInBufferRange(pattern, range, iterator);
			})
			: editor.scan(pattern, iterator);
	});
}
