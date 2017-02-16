"use strict";

const fs = require("fs");
const {spawn} = require("child_process");


class Groff{

	processFile(input, output, format = null){
		format = format || this.deviceByExtension(output);
		return this.process({inputFile: input, format, outputPath: output});
	}
	
	
	processData(input, output, format = null){
		format = format || this.deviceByExtension(output);
		return this.process({inputData: input, format, outputPath: output});
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
	
	
	process(args = {}){
		const {
			format     = "ps",
			raw        = false,
			verbose    = false,
			inputFile  = "",
			inputData  = "",
			outputPath = "",
		} = args;
		
		return new Promise((resolve, reject) => {
			const args = [["-T" + format, inputData ? "-" : inputFile], inputData];
			
			this.exec("grog", ...args).then(result => {
				const {stdout, stderr} = result;
				
				// `grops` always exits with 0, even for missing files.
				if(stdout.match(/\n/g).length > 1){
					const [first, ...rest] = stdout.split(/\n/);
					const error = new Error(`grog: ${first}`);
					error.details = stderr + rest.join("\n");
					return reject(error);
				}
				
				const [exec, ...args] = stdout.split(/\s+/).filter(Boolean);
				args.unshift("-D", "utf8");
				raw && args.unshift("-Z");
				
				return this.exec(exec, args, inputData, outputPath).then(result => {
					const {code, stdout, stderr} = result;
					if(!code){
						verbose && stderr && console.error(stderr);
						return resolve(stdout);
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


	deviceByExtension(input){
		if(!input) return null;
		input = input.toLowerCase().match(/\.(dvi|html?|ps|pdf)$/);
		if(!input) return null;
		return "htm" === input[1] ? "html" : input[1];
	}
}


module.exports = new Groff();
