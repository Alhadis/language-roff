"use strict";

const {join, resolve} = require("path");
const fs = require("fs");

describe("Syntax highlighting", function(){
	this.timeout(30000);
	let roff;
	
	before(async () => {
		await atom.packages.activatePackage("language-hyperlink");
		const pkg = await atom.packages.activatePackage(resolve(__dirname, ".."));
		roff = pkg.grammars.find(g => "text.roff" === g.scopeName);
	});
	
	const inputDir  = join(__dirname, "fixtures", "input");
	const outputDir = join(__dirname, "fixtures", "output");
	const files = fs.readdirSync(inputDir);
	for(const filename of files){
		const input  = fs.readFileSync(join(inputDir, filename), "utf8").replace(/\n+$/, "");
		const output = fs.readFileSync(join(outputDir, filename + ".json"), "utf8");
		it(`tokenises ${filename}`, () => roff.tokenizeLines(input).should.eql(
			JSON.parse(output).map(l => l.map(([value, ...scopes]) => ({value, scopes})))));
	}
});
