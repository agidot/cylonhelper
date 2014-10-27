'use strict';



function Element(element) {
	this.element = element;
	this.Xpath = this.getElementXPath(element);
	this.name =  this.getElementDefaultName(element);
}
Element.prototype.getElementDefaultName = function(element){
	return $(element).html();
};
Element.prototype.getElementTreeXPath = function(element){
	var paths = [];
  // Use nodeName (instead of localName) so namespace prefix is included (if any).
	for(; element && element.nodeType === 1; element = element.parentNode){
		var index = 0;
		for(var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling){
			// Ignore document type declaration.
			if(sibling.nodeType === Node.DOCUMENT_TYPE_NODE){
				continue;
			}
			if(sibling.nodeName === element.nodeName){
				++index;
			}
		}
		var tagName = element.nodeName.toLowerCase();
		var pathIndex = (index ? '[' + (index+1) + ']' : '');
		paths.splice(0, 0, tagName + pathIndex);
	}
	return paths.length ? '/' + paths.join('/') : null;
};

Element.prototype.getElementXPath = function(element){
	if(element && element.id){
		return '//*[@id="' + element.id + '"]';
	}
	else{
		return this.getElementTreeXPath(element);
	}
};

// export the class
//module.exports = Element;
