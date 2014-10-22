'use strict';

function Page(){
  this.elements = [];
  this.name = null;
  this.tabId = null;
}
var pages = {};

var bg = chrome.extension.getBackgroundPage();
var tabId = null;
var tabURL = null;
function renderXpaths(){

  var html = '<ul class="pages">';
  for(var i in pages){
    html = html + '<li>' + '<span>' + i + '</span>';
    html += '<ul class= "XpathList">';
    for(var j = 0; j < pages[i].elements.length; j++){
      html = html +'<li>' + pages[i].elements[j].Xpath + '</li>';
    }
    html += '</ul>';
    html += '</li>';
  }
  html += '</ul>';
  console.log(html);
  $('#Xpath-container').html(html);

  $('.XpathList > li').mouseenter(function(e){
    var url = $(this).parent().parent().children('span').text();
    chrome.tabs.sendMessage(pages[url].tabId,{
      'msg':'changeStyleAtXpath','Xpath':$(this).text()});
  }).mouseleave(function(e){
    var url = $(this).parent().parent().children('span').text();
    chrome.tabs.sendMessage(pages[url].tabId,{
      'msg':'recoverStyleAtXpath','Xpath':$(this).text()});
  });
  // Click at element level
  $('.XpathList > li').click(function(e){
    var url = $(this).parent().parent().children('span').text();
    chrome.tabs.sendMessage(pages[url].tabId,{
      'msg':'removeStyleAtXpath','Xpath':$(this).text()});
    $(this).remove();
    pages[url].elements.splice($(this).index(),1);
  });

}

function processIncomingMessage(request,sendResponse){
	if(request.msg === 'addElement'){
		var element = request.element;
		console.log(element);
    console.log(tabURL);
    if(pages[tabURL] === undefined || pages[tabURL] === null){
      pages[tabURL] = new Page();
      pages[tabURL].tabId = tabId;
    }
    pages[tabURL].elements.push(element);
    console.log(pages);
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
    console.log(sender.tab);
    tabId = sender.tab.id;
    tabURL = sender.tab.url;
		processIncomingMessage(request,sendResponse);
	}
);

$(function() {
	$('#clearButton').click(function(e){
    console.log(pages);
    for(var i in pages){
      //bg.sendMessageToTab(pages[i].tabId,{'msg':'removeAllStyles'});
	    chrome.tabs.sendMessage(pages[i].tabId,{'msg':'removeAllStyles'});
    }
    pages = {};

    renderXpaths();
	});
});
$('.elements li').click(function(e){
	$('.elements li').removeClass('active');
	$(this).addClass('active');
});
