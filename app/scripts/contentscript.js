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
		if(stripTrailingSlash(document.URL) !== request.url){
			console.log(request.url);
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
	else if(request.msg === 'findXpaths'){
		removeAllStyles();
		for(var i in request.Xpaths){
			findXpath(request.Xpaths[i]);
		}
	}
	else if(request.msg === 'findXpath'){
		removeStyleAtXpath(request.Xpath);
		findXpath(request.Xpath);
		changeStyleAtXpath(request.Xpath);
	}
}
var selectedBorderClass = 'cylon-highlight';
var hoverBorderClass = 'cylon-hover';

function stripTrailingSlash(str) {
  if(str.substr(-1) === '/') {
    return str.substr(0, str.length - 1);
  }
  return str;
}


function addCylonHighlight(element){
	if(!$(element).hasClass(selectedBorderClass)){
		$(element).addClass(selectedBorderClass);
	}
}

function removeCylonHighlight(element){
	$(element).removeClass(selectedBorderClass);
}

function addCylonHover(element){
	if(!$(element).hasClass(hoverBorderClass)){
		$(element).addClass(hoverBorderClass);
	}
}

function removeCylonHover(element){
	$(element).removeClass(hoverBorderClass);
}

function findXpath(Xpath){
	var elementByXpath = getElementByXpath(Xpath);
	var found = false;
	if(elementByXpath){
		var element = new Element(elementByXpath,Xpath);
		for(var i = 0; i < elements.length; i++){
			if(elementByXpath === elements[i].element){
				found = true;
			}
		}
		if(!found){
			addCylonHighlight(element.element);
			elements.push(element);
			found = true;
		}
	}
	console.log(Xpath);
	console.log(elementByXpath);
	console.log(found);

	chrome.runtime.sendMessage({'msg':'checkXpath','Xpath':Xpath,'found':found},function(respond){
		if(respond){
			processIncomingRespond(respond);
		}
	});
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
			if(elements[i].element === currentElement){
				return;
			}
		}
		elements.push(element);
		sendElement(element);
	}
}
function changeStyleAtXpath(Xpath){
	for(var i in elements){
		if(elements[i].Xpath === Xpath){
			$('html, body').stop( true, true ).animate({
				scrollTop: $(elements[i].element).offset().top
			}, 200);
			addCylonHover(elements[i].element);
			return true;
		}
	}
	return false;
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
