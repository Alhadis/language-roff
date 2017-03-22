"use strict";

const fs = require("fs");
const {spawn} = require("child_process");


class Groff{
	
	process(args = {}){
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
			
			this.exec("grog", ...args).then(result => {
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
					if((inputData || this.read(inputPath)).match(tmacMatch)){
						const missingFlag = {
							eqn:   "-e",  pic:   "-p",
							grap:  "-G",  refer: "-R",
							chem:  "-j",  tbl:   "-t",
						}[RegExp.lastParen];
						args.unshift(missingFlag);
					}
				}
				args.unshift("-D", "utf8", ...extraArgs);
				
				return this.exec(exec, args, inputData, outputPath).then(result => {
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
	}
	
	
	read(filePath, length = 80){
		const editor = atom.workspace.getActiveTextEditor();
		if(editor && filePath === editor.getPath())
			return editor.getText();
		else{
			const fd = fs.openSync(filePath, "r");
			const buffer = new Buffer(length);
			const bytesRead = fs.readSync(fd, buffer, 0, length);
			return buffer.toString("utf8").replace(/\0+$/, "");
		}
	}
}


module.exports = new Groff();
