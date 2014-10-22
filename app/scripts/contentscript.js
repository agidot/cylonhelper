'use strict';
var currentElement = null;
var elements = [];

console.log('Content script');
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                'from a content script:' + sender.tab.url :
                'from the extension');
    processIncomingMessage(request);
  }
);
chrome.runtime.sendMessage({'msg':'newPage'},function(respond){
	if(respond){
		processIncomingRespond(respond);
	}
});
function processIncomingMessage(request){
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
}
var selectedBorder = '2px dashed #f00';
var hoverBorder = '2px dashed #01DF3A';

function processIncomingRespond(respond){
	if(respond.msg === 'success'){
		$(currentElement).css('border',selectedBorder);
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
		  $(elements[i].element).css('border',hoverBorder);
    }
  }
}
function recoverStyleAtXpath(Xpath){
  for(var i in elements){
    if(elements[i].Xpath === Xpath){
		  $(elements[i].element).css('border',selectedBorder);
    }
  }
}
function removeStyleFromElement(element){
  $(element).removeAttr('style');
}

function removeAllStyles(){
	for(var i in elements){
		removeStyleFromElement(elements[i].element);
	}
}

function removeStyleAtXpath(Xpath){
  for(var i in elements){
    if(elements[i].Xpath === Xpath){
      removeStyleFromElement(elements[i].element);
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

