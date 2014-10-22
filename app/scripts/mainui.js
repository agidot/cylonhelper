'use strict';

function Page(url){
  this.elements = [];
  this.name = null;
  this.tabId = null;
  this.urlName = url;
}
var pages = {};

var bg = chrome.extension.getBackgroundPage();
var tab = null;
function renderXpaths(){
  var count = 0;
  var html = '';
  for(var i in pages){
    html += '<div class = "panel-group page-object" id = "page-object-' + count + '">';
    html += '<div class = "panel panel-default">';
    html += '<div class = "panel-heading">';
    html += '<h4 class = "panel-title">';
    html += '<a data-toggle = "collapse" data-parent = "" href = "#page-object-panel-' + count +'">';
    html +=  'Page #' + (count+1);
    html += '</a>';
    html += '<a href="#" class="pull-right">';
    html += '<i class="fa fa-close remove-button remove-page-button"></i>';
    html += '</a>';
    html += '</h4>';
    html +=	'</div>';
    html +=	'<div id="page-object-panel-' + count + '"class="panel-collapse collapse in">';
    html +=	'<div class="panel-body">';
    html +=	'<div>';
    html += '<input type="text" class="page-name-textbox" placeholder="' + pages[i].name +'">';
    html += '<input type="text" class="page-url-textbox" placeholder="'+ pages[i].urlName +'">';
    html += '</div>';
    html += '<h5>Elements</h5>';
    html += '<ul class="elements">';
    for(var j = 0; j < pages[i].elements.length; j++){
      html += '<li>';
      html += '<span class="element-no">' + (j+1) +'</span>';
      html += '<a href="#" class="remove-button remove-element-button">';
      html += '<i class="fa fa-close"></i>';
      html += '</a>';
      html += '<input type="text" class="element-name-textbox" placeholder="Element Name">';
      html += '</li>';
    }
    html += '</ul>';

    html += '</div>';
    html += '</div>';
    html +='</div>';
    html +='</div>';

    count++;
  }
  $('#container').html(html);
  $('.elements > li').mouseenter(function(e){
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    var element = $(this);
    chrome.tabs.get(pages[url].tabId,function(targetTab){
      if(targetTab.url === url){
        console.log(pages[url]);
        console.log(targetTab.id);
        chrome.tabs.sendMessage(pages[url].tabId,{'msg':'changeStyleAtXpath','Xpath': pages[url].elements[element.index()].Xpath});
      }
    });
  }).mouseleave(function(e){
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    var element = $(this);
    chrome.tabs.get(pages[url].tabId,function(targetTab){
      if(targetTab.url === url){
        chrome.tabs.sendMessage(pages[url].tabId,{'msg':'recoverStyleAtXpath','Xpath': pages[url].elements[element.index()].Xpath});
      }
    });
  });

  $('.remove-element-button').click(function(e){
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    var index = $(this).closest('li').index();
    chrome.tabs.get(pages[url].tabId,function(targetTab){
      if(targetTab.url === url){
        chrome.tabs.sendMessage(pages[url].tabId,{'msg':'removeStyleAtXpath','Xpath':pages[url].elements[index].Xpath});
      }
    });
    pages[url].elements.splice(index,1);
    renderXpaths();

  });
  $('.remove-page-button').click(function(e){
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    chrome.tabs.get(pages[url].tabId,function(targetTab){
      if(targetTab.url === url){
        chrome.tabs.sendMessage(pages[url].tabId,{'msg':'removeAllStyles'});
      }
    });
    delete pages[url];
    renderXpaths();
  });
}

function processIncomingMessage(request,sendResponse){
  if(request.msg === 'addElement'){
    var element = request.element;
    console.log(element);
    if(pages[tab.url] === undefined){
      pages[tab.url] = new Page(tab.url);
      pages[tab.url].name = tab.title;
      pages[tab.url].tabId = tab.id;
    }
    pages[tab.url].elements.push(element);
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
    tab = sender.tab;
    processIncomingMessage(request,sendResponse);
  }
  );

$(function() {
  $('#clear-all-button').click(function(e){
    for(var i in pages){
      chrome.tabs.sendMessage(pages[i].tabId,{'msg':'removeAllStyles'});
    }
    pages = {};
    renderXpaths();
  });
  $('.elements li').click(function(e){
    $('.elements li').removeClass('active');
    $(this).addClass('active');
  });
});
