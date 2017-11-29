"use strict";

class ManpageView{
	
	constructor(){
		
	}
	
	getIconName(){
		return "manpage-icon";
	}
	
	
	getURI(){
		const frag = this.fragment ? "#" + this.fragment : "";
		return `man://${this.topic}/${this.section}` + frag;
	}
	
	
	getPath(){
		
	}
}

module.exports = ManpageView;
