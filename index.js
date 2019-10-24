"use strict";

let disposables = null;

module.exports = {
	activate(){
		const {CompositeDisposable} = require("atom");
		disposables = new CompositeDisposable();
		const packageFiles = [
			"./lib/conversion.js",
			"./lib/editing.js",
			"./lib/hyperlinks.js",
			"./lib/previewing.js",
		];
		// Don't block main thread while activating.
		return Promise.resolve().then(() => {
			for(const file of packageFiles)
				disposables.add(...require(file)());
		});
	},
	
	deactivate(){
		if(null !== disposables){
			disposables.dispose();
			disposables = null;
		}
	},
	
	createManpageView(state){
		const fs = require("fs");
		if(state.editorId || fs.existsSync(state.filePath) && fs.lstatSync(state.filePath).isFile()){
			const ManpageView = require("./lib/views/manpage-view.js");
			return new ManpageView(state);
		}
	},
};
