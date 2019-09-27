"use strict";

/**
 * Register commands for editing Roff source.
 * @return {Disposable[]}
 * @internal
 */
module.exports = () => [
	atom.commands.add("atom-text-editor[data-grammar='text roff']", {
		"language-roff:fix-blank-lines": ev => fixBlankLines(ev),
		"language-roff:insert-block":    ev => insertBlock(ev),
		"language-roff:indent":          ev => indentEditor(ev),
		"language-roff:outdent":         ev => outdentEditor(ev),
		"language-roff:curly-bracket":   ev => insertCurlyBracket(ev),
		"language-roff:round-bracket":   ev => insertRoundBracket(ev),
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
 * Insert a properly-escaped and indented `\{\ … .\}` block.
 * @param {CustomEvent} [event=null]
 * @internal
 */
function insertBlock(event = null){
	const ed = event && event.currentTarget
		? event.currentTarget.getModel()
		: atom.workspace.getActiveTextEditor();
	
	ed && ed.transact(100, () => {
		const tab = ed.getTabText();
		
		for(const selection of ed.getSelectionsOrderedByBufferPosition()){
			const range      = selection.getBufferRange();
			const textBefore = ed.buffer.getTextInRange([[range.start.row, 0], range.start]);
			const textAfter  = ed.buffer.getTextInRange([range.end, ed.buffer.rangeForRow(range.end.row).end]);
			const ctrlStart  = /^([.'])([ \t]*)/.test(textBefore);
			const ctrlChar   = ctrlStart ? RegExp.$1 : ".";
			const indent     = ctrlStart ? RegExp.$2 : "";
			const before     = "\\{\\\n";
			const after      = `\n${ctrlChar}${indent}\\}${textAfter.trim() ? "\n" + textAfter : ""}`;
			
			if(selection.isEmpty()){
				selection.insertText(ctrlStart ? (before + ctrlChar + indent + tab) : before);
				const centre = selection.getBufferRange();
				selection.insertText(after);
				selection.setBufferRange(centre);
			}
			
			else{
				let text = selection.getText();
				if(!text.trim())
					wrap("\\{", "\\}", selection);
				else{
					text = text.split(/\r?\n/)
						.map(l => /^([.'][ \t]*)(.*)$/.test(l) ? RegExp.$1 + indent + tab + RegExp.$2 : l)
						.join(ed.buffer.getPreferredLineEnding());
					selection.insertText(text, {select: true, normalizeLineEndings: false});
					wrap(before, after, selection);
				}
			}
		}
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
 * Trigger `language-roff:insert-block` when typing "{" after a conditional.
 * @param {CustomEvent} event
 * @internal
 */
function insertCurlyBracket(event){
	const ed = atom.workspace.getActiveTextEditor();
	for(const selection of ed.getSelectionsOrderedByBufferPosition()){
		if(!selection.isEmpty()) continue;
		const range      = selection.getBufferRange();
		const before     = [[range.start.row, 0], range.start];
		const after      = [range.end, ed.buffer.rangeForRow(range.end.row).end];
		const textBefore = ed.buffer.getTextInRange(before);
		const textAfter  = ed.buffer.getTextInRange(after);
		if(/^[.'][ \t]*(?:if|ie|el)(?:.*?[^\\])?$/.test(textBefore) && !textAfter.trim()){
			if(after) ed.buffer.setTextInRange(textAfter, "");
			insertBlock(event);
			return;
		}
	}
	event.abortKeyBinding();
}


/**
 * Suppress auto-insertion of closing parenthesis after an escape sequence.
 * @param {CustomEvent} event
 * @internal
 */
function insertRoundBracket(event){
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
		const {cursor} = ed.getLastSelection();
		if(!cursor.getBufferColumn() && !cursor.isAtEndOfLine())
			cursor.moveRight();
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


/**
 * Enclose a text selection with two strings.
 *
 * @param {String} before
 * @param {String} after
 * @param {Selection} [target=null]
 * @internal
 */
function wrap(before, after, target = null){
	before = String(before);
	after  = String(after);
	target = target || atom.workspace.getActiveTextEditor();
	if(atom.workspace.isTextEditor(target))
		target = target.getLastSelection();
	const {editor} = target;
	const nl = /\r?\n/g;
	return editor.transact(100, () => {
		const range = target.getBufferRange();
		const Point = range.start.constructor;
		const xlate = new Point((before.match(nl) || []).length, (before.split(nl).pop()).length);
		const start = range.start.translate(xlate);
		const end   = range.end.translate(range.start.row === range.end.row ? xlate : [xlate.row, 0]);
		target.insertText(before + target.getText() + after, {normalizeLineEndings: false});
		target.setBufferRange([start, end]);
	});
}
