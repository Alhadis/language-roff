"use strict";

/**
 * Register commands for editing Roff source.
 * @return {Disposable[]}
 * @internal
 */
module.exports = () => [
	atom.commands.add("atom-text-editor[data-grammar='text roff']", {
		"language-roff:fix-blank-lines": ev => fixBlankLines(ev),
		"language-roff:indent":          ev => indentEditor(ev),
		"language-roff:outdent":         ev => outdentEditor(ev),
		"language-roff:open-bracket":    ev => insertOpenBracket(ev),
		"language-roff:single-quote":    ev => insertSingleQuote(ev),
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
	const ed = atom.workspace.getActiveTextEditor();
	
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
 * @param {CustomEvent} event
 * @internal
 */
function indentEditor(event){
	const ed = atom.workspace.getActiveTextEditor();
	
	// Determine if snippet expansion is possible at the current cursor
	const pkg = atom.packages.getActivePackage("snippets");
	if(pkg && pkg.mainModule && "function" === typeof pkg.mainModule.snippetToExpandUnderCursor)
		if(pkg.mainModule.snippetToExpandUnderCursor(ed) || pkg.mainModule.goToNextTabStop(ed))
			return event.abortKeyBinding();
	
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
					? ed.setTextInBufferRange(firstRange, firstChar[0] + tab)
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
 * @param {CustomEvent} event
 * @internal
 */
function outdentEditor(event){
	const ed = atom.workspace.getActiveTextEditor();
	
	// Terminate command if a snippet is active and a previous tabstop exists
	const pkg = atom.packages.getActivePackage("snippets");
	if(pkg && pkg.mainModule && "function" === typeof pkg.mainModule.goToPreviousTabStop)
		if(pkg.mainModule.goToPreviousTabStop(ed))
			return event.abortKeyBinding();
	
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


/**
 * Suppress auto-insertion of closing bracket after an escape sequence.
 * @param {CustomEvent} event
 * @internal
 */
function insertOpenBracket(event){
	const ed = atom.workspace.getActiveTextEditor();
	if(1 !== ed.selections.length)
		return event.abortKeyBinding();
	
	const selection = ed.getLastSelection();
	if(!selection.isEmpty())
		return event.abortKeyBinding();
	
	const {start} = selection.getBufferRange();
	const range = [[start.row, 0], start];
	const before = ed.getTextInBufferRange(range);
	if(/(?:\\E?.?\(\.?|\\E?.?)$/.test(before)){
		ed.setTextInBufferRange(range, before + "(");
		return;
	}
	event.abortKeyBinding();
}


/**
 * Handle suppressed or forced insertion of closing single-quotes.
 * @param {CustomEvent} event
 * @internal
 */
function insertSingleQuote(event){
	const ed = atom.workspace.getActiveTextEditor();
	if(1 !== ed.selections.length)
		return event.abortKeyBinding();
	
	const selection = ed.getLastSelection();
	if(!selection.isEmpty())
		return event.abortKeyBinding();
	
	// Suppress closing quote in first column
	const start = selection.getHeadBufferPosition();
	if(!start.column){
		const range = ed.bufferRangeForBufferRow(start.row);
		ed.setTextInBufferRange(range, "'" + ed.getTextInRange(range));
		selection.cursor.moveRight();
		return;
	}
	
	// Auto-insert a closing quote after a "parametric" escape sequence
	const before = ed.getTextInBufferRange([[start.row, 0], start]);
	if(/\\E?[ABCDHLNRSXZbhlovwx]$/.test(before)){
		selection.insertText("''", {normalizeLineEndings: false});
		selection.setBufferRange([start, start]);
		selection.cursor.moveRight();
		return;
	}
	
	event.abortKeyBinding();
}
