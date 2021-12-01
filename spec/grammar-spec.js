"use strict";

const {join, resolve} = require("path");
const fs = require("fs");

describe("Syntax highlighting", function(){
	this.timeout(30000);
	let roff, ditroff, pic;
	
	before(async () => {
		await atom.packages.activatePackage("language-hyperlink");
		const pkg = await atom.packages.activatePackage(resolve(__dirname, ".."));
		roff    = pkg.grammars.find(g => g.scopeName === "text.roff");
		ditroff = pkg.grammars.find(g => g.scopeName === "source.ditroff");
		pic     = pkg.grammars.find(g => g.scopeName === "source.pic");
	});
	
	const inputDir  = join(__dirname, "fixtures", "input");
	const outputDir = join(__dirname, "fixtures", "output");
	const files = fs.readdirSync(inputDir);
	for(const filename of files){
		const input  = fs.readFileSync(join(inputDir, filename), "utf8").replace(/\n+$/, "");
		const output = fs.readFileSync(join(outputDir, filename + ".json"), "utf8");
		it(`tokenises ${filename}`, () => {
			const grammar = /\.(?:pic|pikchr)$/i.test(filename) ? pic : filename.startsWith("ditroff.") ? ditroff : roff;
			const savedTokens = JSON.parse(output).map(l => l.map(([value, ...scopes]) => ({value, scopes})));
			grammar.tokenizeLines(input).should.eql(savedTokens);
		});
	}
});
