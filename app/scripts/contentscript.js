'use strict';
var currentElement = null;
var elements = [];
console.log('Content script');
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                'from a content script:' + sender.tab.url :
                'from the extension');
    console.log(request);
    processIncomingMessage(request);
  }
);
chrome.runtime.sendMessage({'msg':'newPage'},function(respond){
	if(respond){
		processIncomingRespond(respond);
	}
});
function processIncomingMessage(request){

	if(request.msg === 'startExtension'){
		enableKeysBinding();
	}
	else if(request.msg === 'stopExtension'){
		disableKeysBinding();
	}
}
function processIncomingRespond(respond){
	console.log(respond);
	if(respond.msg === 'success'){
		$(currentElement).css('border','2px dashed #f00');
	}
	else if(respond.msg === 'startExtension'){
		processIncomingMessage(respond);
	}
}

function sendElement(element){
	var elementToSend = {};
	elementToSend.Xpath = element.Xpath;
	elementToSend.name = element.name;
	chrome.runtime.sendMessage({'msg':'addElement', 'element':elementToSend},function(respond){
		if(respond){
			processIncomingRespond(respond);
		}
		else{
			console.log('No respond');
		}
	});
}


var mouse = {x: 0, y: 0};
document.addEventListener('mousemove', function(e){
	mouse.x = e.clientX || e.pageX;
	mouse.y = e.clientY || e.pageY;
}, false);

function keysBinding(e){
	if(e.shiftKey){
		currentElement = document.elementFromPoint(mouse.x,mouse.y);
		var element = new Element(currentElement);
		elements.push(element);
		console.log(element);
		sendElement(element);
	}
}

function disableKeysBinding(){
	$(document).unbind('keydown',keysBinding);
	for(var i in elements){
		$(elements[i].element).removeAttr('style');
	}
}
function enableKeysBinding(){
	$(document).keydown(keysBinding);
}

