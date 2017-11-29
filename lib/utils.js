"use strict";

const {spawn} = require("child_process");
const fs      = require("fs");


module.exports = {
	
	/**
	 * Create a new DOM element.
	 *
	 * @see {@link http://github.com/Alhadis/Utils}
	 * @param {String} type - Tag-name of element to create.
	 * @param {Object} [attr] - Optional attributes to assign.
	 * @return {Element}
	 */
	New(type, attr = null){
		function absorb(a, b){
			for(const i in b)
				if(Object(a[i]) === a[i] && Object(b[i]) === b[i])
					absorb(a[i], b[i]);
				else a[i] = b[i];
		};
		const node = document.createElement(type);
		if(null !== attr) absorb(node, attr);
		return node;
	},

	
	/**
	 * Execute an external command.
	 *
	 * @param {String} cmd - Executed command
	 * @param {String[]} args - List of arguments/switches
	 * @param {String} [inputData] - Data piped to stdin
	 * @param {String} [outputPath] - File to write stdout to
	 * @return {Promise} Resolves to an object
	 */
	exec(cmd, args, inputData = "", outputPath = ""){
		return new Promise((resolve, reject) => {
			const stdio = outputPath
				? ["pipe", fs.openSync(outputPath, "w"), "pipe"]
				:  "pipe";
			
			const proc = spawn(cmd, args, {stdio});
			
			if(inputData){
				proc.stdin.write(inputData, "utf8");
				proc.stdin.end();
			}
			
			let stdout = "";
			if(!outputPath){
				proc.stdout.setEncoding("utf8");
				proc.stdout.on("data", data => stdout += data);
			}
			let stderr = "";
			proc.stderr.setEncoding("utf8");
			proc.stderr.on("data", data => stderr += data);
			proc.on("close", code => resolve({code, stdout, stderr}));
		});
	},
	
	
	/**
	 * Load a file synchronously, reusing an opened buffer if possible.
	 *
	 * If sourced from a buffer, the `maxBytes` parameter is ignored.
	 * 
	 * @param {String} filePath
	 * @param {Number} [maxBytes=80]
	 * @return {String}
	 */
	readFile(filePath, maxBytes = 80){
		const editor = atom.workspace.getActiveTextEditor();
		if(editor && filePath === editor.getPath())
			return editor.getText();
		else{
			const fd = fs.openSync(filePath, "r");
			const buffer = new Buffer(maxBytes);
			const bytesRead = fs.readSync(fd, buffer, 0, maxBytes);
			return buffer.toString("utf8").replace(/\0+$/, "");
		}
	},
	
	
	/**
	 * Resolve a reference to a named manual-page.
	 *
	 * @public
	 * @example <caption>Basic usage</caption>
	 *   resolveManRef("getopt(3)")  => ["getopt", "3"]
	 *   resolveManRef("getopt", 3)  => ["getopt", "3"]
	 *   resolveManRef("getopt")     => ["getopt", ""]
	 *
	 * @param {...String} args
	 *   One or two strings, denoting topic (and possible section),
	 *   expressed in one of the following formats:
	 *
	 *       topic            - "foo"
	 *       topic(section)   - "foo(5)"
	 *       topic section    - "foo", "5"
	 *       section topic    - "5", "foo"
	 *
	 *   The last format is only accepted if the section begins with
	 *   a digit, falls below 5 characters in length, and precedes a
	 *   topic name which does *not* begin with an ASCII digit.
	 *
	 * @example <caption>Handling of non-numeric section names.</caption>
	 *   resolveManRef("3pm", "if")  => ["if", "3pm"]
	 *   resolveManRef("if", "ntcl") => ["if", "ntcl"]
	 *   resolveManRef("ntcl", "if") => ["ntcl", "if"]
	 * 
	 * @return {String[]}
	 *   An array containing name and section, respectively.
	 *   Empty strings indicate unspecified or invalid input.
	 */
	resolveManRef(...args){
		switch(args.length){
			case 0:
				return ["", ""];
			case 1:
				return /^\s*([^()<>\s]+)\s*\(([^\)\s]+)\)\s*$/.test(args[0])
					? [RegExp.$1, RegExp.$2]
					: [args[0], ""];
			default:
				const result = args.slice(0, 2).map(String);
				const numeric = /^\s*[0-9]\S*\s*$/;
				if(result[0].length < 5 && numeric.test(result[0]) && !numeric.test(result[1]))
					result.reverse();
				return result;
		}
	},
};
