'use strict';
var currentElement = null;
var currentXpath = null;
var addedElements = [];
console.log('Content script');
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                'from a content script:' + sender.tab.url :
                'from the extension');
    console.log(request);
    processIncomingMessage(request.msg);
});

function processIncomingMessage(msg){

	if(msg === 'startExtension'){
		enableKeysBinding();
	}
	else if(msg === 'stopExtension'){
		disableKeysBinding();
	}
}
function processIncomingRespond(msg){
	if(msg === 'success'){
		$(currentElement).css('border','2px dashed #f00');
	}
}
var getElementTreeXPath = function(element){
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
var getElementXPath = function(element){
	if(element && element.id){
		return '//*[@id="' + element.id + '"]';
	}
	else{
		return getElementTreeXPath(element);
	}
};
function sendXpath(Xpath){
	chrome.runtime.sendMessage({'msg':'addXpath', 'Xpath':Xpath},function(respond){
		if(respond){
			processIncomingRespond(respond.msg);
		}
		else{
			console.log('No respond');
		}
	});
	console.log('sent ' + Xpath);
}


var mouse = {x: 0, y: 0};
document.addEventListener('mousemove', function(e){
	mouse.x = e.clientX || e.pageX;
	mouse.y = e.clientY || e.pageY;
}, false);

function keysBinding(e){
	if(e.shiftKey){
		currentElement = document.elementFromPoint(mouse.x,mouse.y);
		addedElements.push(currentElement);
		currentXpath = getElementXPath(currentElement);
		sendXpath(currentXpath);
	}
}

function disableKeysBinding(){
	$(document).unbind('keydown',keysBinding);
	for(var i in addedElements){
		$(addedElements[i]).removeAttr('style');
	}
}
function enableKeysBinding(){
	$(document).keydown(keysBinding);
}

