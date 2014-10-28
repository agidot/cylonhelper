'use strict';
var currentElement = null;
var elements = [];

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			'from a content script:' + sender.tab.url :
			'from the extension');
		processIncomingMessage(request);
	}
	);
$(function() {
	chrome.runtime.sendMessage({'msg':'newPage'},function(respond){
		if(respond){
			processIncomingRespond(respond);
		}
	});
});
function processIncomingMessage(request){
	if(request.url){
		if(document.URL !== request.url){
			return;
		}
	}
	console.log(request);
	if(request.msg === 'startExtension'){
		enableKeysBinding();
	}
	else if(request.msg === 'removeAllStyles'){
		removeAllStyles();
	}
	else if(request.msg === 'changeStyleAtXpath'){
		changeStyleAtXpath(request.Xpath);
	}
	else if(request.msg === 'recoverStyleAtXpath'){
		recoverStyleAtXpath(request.Xpath);
	}
	else if(request.msg === 'removeStyleAtXpath'){
		removeStyleAtXpath(request.Xpath);
	}
	else if(request.msg === 'stopExtension'){
		disableKeysBinding();
	}
	else if(request.msg === 'addXpaths'){
		addXpaths(request.Xpaths);
	}
}
var selectedBorderClass = 'cylon-highlight';
var hoverBorderClass = 'cylon-hover';

function addCylonHighlight(element){
	if(!$(element).hasClass(selectedBorderClass))
		$(element).addClass(selectedBorderClass);
}

function removeCylonHighlight(element){
	if($(element).hasClass(selectedBorderClass))
		$(element).removeClass(selectedBorderClass);
}

function addCylonHover(element){
	if(!$(element).hasClass(hoverBorderClass))
		$(element).addClass(hoverBorderClass);
}

function removeCylonHover(element){
	if($(element).hasClass(hoverBorderClass))
		$(element).removeClass(hoverBorderClass);
}

function addXpaths(Xpaths){
	for(var i in Xpaths){
		var element = new Element(getElementByXpath(Xpaths[i]));
		$(element).css('border',selectedBorder);
		elements.push(element);
	}

}
function getElementByXpath (path) {
	return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function processIncomingRespond(respond){
	if(respond.msg === 'success'){
		addCylonHighlight(currentElement);
	}
	else if(respond.msg === 'startExtension'){
		processIncomingMessage(respond);
	}
}

function sendElement(element){
	var elementToSend = {};
	elementToSend.Xpath = element.Xpath;
	elementToSend.name = element.name;
	chrome.runtime.sendMessage(
		{'msg':'addElement',
		'element':elementToSend},
		function(respond){
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
		for(var i = 0; i < elements.length; i++){
			if(elements[i].Xpath === element.Xpath){
				return;
			}
		}
		elements.push(element);
		console.log(element);
		sendElement(element);
	}
}
function changeStyleAtXpath(Xpath){
	for(var i in elements){
		if(elements[i].Xpath === Xpath){
			addCylonHover(elements[i].element);
		}
	}
}
function recoverStyleAtXpath(Xpath){
	for(var i in elements){
		if(elements[i].Xpath === Xpath){
			removeCylonHover(elements[i].element);
			addCylonHighlight(elements[i].element);
		}
	}
}
function removeStyleFromElement(element){
	removeCylonHover(element);
	removeCylonHighlight(element);
}

function removeAllStyles(){
	for(var i in elements){
		removeCylonHover(elements[i].element);
		removeCylonHighlight(elements[i].element);
	}
	elements = [];
}

function removeStyleAtXpath(Xpath){
	for(var i = 0; i < elements.length; i++){
		if(elements[i].Xpath === Xpath){
			console.log(elements[i].Xpath);
			removeStyleFromElement(elements[i].element);
			elements.splice(i,1);
			return;
		}
	}
}
function disableKeysBinding(){
	$(document).unbind('keydown',keysBinding);
	removeAllStyles();
}
function enableKeysBinding(){
	$(document).keydown(keysBinding);
}
