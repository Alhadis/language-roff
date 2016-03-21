#!/usr/local/bin/node --es_staging
"use strict";

/** Load test fixture */
const fs           = require("fs");
const filePath     = process.argv[2];
const fileContents = fs.readFileSync(filePath).toString();


/** Highlight its content */
const Highlights   = require("highlights");
const highlight    = new Highlights();
highlight.requireGrammarsSync({
	modulePath: require.resolve("./package.json")
});


/** Send that sucker to STDOUT */
process.stdout.write(highlight.highlightSync({
	fileContents: fileContents,
	scopeName: "text.roff"
}));
