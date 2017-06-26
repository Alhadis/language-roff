"use strict";

let disposables = null;

module.exports = {
	activate(){
		const {CompositeDisposable} = require("atom");
		disposables = new CompositeDisposable();
		const packageFiles = [
			"./lib/conversion.js",
			"./lib/editing.js",
		];
		for(const file of packageFiles)
			disposables.add(...require(file)());
	},
	
	deactivate(){
		if(null !== disposables){
			disposables.dispose();
			disposables = null;
		}
	}
};
