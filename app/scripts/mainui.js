'use strict';
var elements = [];
var bg = chrome.extension.getBackgroundPage();
function renderXpaths(){
	$('.XpathList').empty();
	for(var i = 0; i < elements.length; i++){
		console.log(i);
		$('.XpathList').append('<li><div>' + elements[i].Xpath + '</li>');
	}
}

function processIncomingMessage(request,sendResponse){
	if(request.msg === 'addElement'){
		var element = request.element;
		console.log(element);
		elements.push(element);
		renderXpaths();
		sendResponse({msg: 'success'});
	}
	else if(request.msg === 'newPage'){
		sendResponse({msg:'startExtension'});
	}
}
function processIncomingRespond(respond,sendResponse){
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			'from a content script:' + sender.tab.url :
			'from the extension');
		processIncomingMessage(request,sendResponse);
	}
);

$('.elements li').click(function(e){
	$('.elements li').removeClass('active');
	$(this).addClass('active');
});