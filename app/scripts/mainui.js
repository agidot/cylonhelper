
'use strict';

function Page(url){
  this.elements = [];
  this.name = null;
  this.urlName = url;
}
var pages = {};
var pageLength = 0;
var pageCount = 0;

var bg = chrome.extension.getBackgroundPage();
var tobeSent = {};
function addElement(pageURL,element,isUpdateScroll){
  pages[pageURL].elements.push(element);
  var elements = pages[pageURL].elements;
  var html = '';
  html += '<li>';
  html += '<span class="element-no">' + elements.length +'</span>';
  html += '<a href="#" class="remove-button remove-element-button">';
  html += '<i class="fa fa-close"></i>';
  html += '</a>';
  html += '<input type="text" class="element-name-textbox" placeholder="Element name", value = "'+ element.name +'"">';
  html += '</li>';
  var domElements = $('.page-url-textbox').filter(function(index){
    return $(this).attr('data-url') === pageURL;
  }).closest('.page-object').find('.elements');
  domElements.append(html);

  var targetElement = $(domElements).find('li:last-child .element-name-textbox');
  
  if(isUpdateScroll){
    scrollTo(targetElement);
  }

  $(targetElement).focus(function(){
    var xpath = element.Xpath;
    $(domElements).siblings('.xpath-text').text(xpath);
  });

  domElements.find('li').eq(elements.length-1).mouseenter(function(e){
    console.log(element);
    if(element.tabId !== null){
      chrome.tabs.sendMessage(element.tabId,{'msg':'changeStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
    }
  }).mouseleave(function(e){
    if(element.tabId !== null){
      chrome.tabs.sendMessage(element.tabId,{'msg':'recoverStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
    }
  });
  domElements.find('.remove-element-button').eq(elements.length-1).click(function(e){
    var removeButton = this;
    var index = $(this).closest('li').index();
    if(element.tabId !== null){
      chrome.tabs.sendMessage(element.tabId,{'msg':'removeStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
    }
    pages[pageURL].elements.splice(index,1);
    $(removeButton).closest('li').remove();
    var elementNumberLabels = $('.element-no');
    for(var i = 0; i < elements.length; i++){
      elementNumberLabels.eq(i).text(i+1);
    }
  });
}

var headerHeight = 100;
function scrollTo(element){
  var offset = $(element).offset().top - headerHeight;
  $('html,body').animate({scrollTop: offset},'slow', function(){
    $(element).focus();
  });
}

function addPage(pageURL,pageTitle){
  var html = '';
  pageCount++;
  pages[pageURL] = new Page(pageURL);
  var page = pages[pageURL];
  pageLength++;
  page.name = pageTitle;

  html += '<div class = "panel-group page-object" >';
  html += '<div class = "panel panel-default">';
  html += '<div class = "panel-heading">';
  html += '<h4 class = "panel-title">';
  html += '<a data-toggle = "collapse" data-parent = "" href = "#page-content-panel-' + pageCount +'">';
  html += 'Page #' + pageCount;
  html += '</a>';
  html += '<a href="#" class="pull-right">';
  html += '<i class="fa fa-close remove-button remove-page-button"></i>';
  html += '</a>';
  html += '</h4>';
  html += '</div>';
  html += '<div id="page-content-panel-' + pageCount +'" class="panel-collapse collapse in">';
  html += '<div class="panel-body">';
  html += '<div>';
  html += '<input type="text" class="page-name-textbox" placeholder="Page Name" value ="' + page.name +'">';
  html += '<input type="text" class="page-url-textbox" placeholder="Page URL" data-url = "'+ pageURL +'" value ="' + pageURL +'">';
  html += '</div>';
  html += '<h5>Elements</h5>';
  html += '<div class="xpath-text">';
  html += '</div>';
  html += '<ul class="elements">';
  html += '</ul>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  $('#container').append(html);


  $('.page-object').eq(pageLength-1).find('.remove-page-button').click(function(e){
    var removeButton = $(this);
    for(var i = 0; i < page.elements.length; i++){
      var element = page.elements[i];
      if(element.tabId){
        chrome.tabs.sendMessage(element.tabId,{'msg':'removeStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
      }
    }
    delete pages[pageURL];
    pageLength--;
    removeButton.closest('.page-object').remove();
  });
}

function processIncomingMessage(request,sender,sendResponse){
  if(request.msg === 'addElement'){
    sendResponse({msg: 'success'});
    var element = request.element;
    element.tabId = sender.tab.id;
    if(pages[sender.tab.url] === undefined){
      addPage(sender.tab.url,sender.tab.title);
    }
    addElement(sender.tab.url,element,true);
  }
  else if(request.msg === 'newPage'){
    sendResponse({msg:'startExtension'});
    if(tobeSent[sender.tab.id]){
      chrome.tabs.sendMessage(sender.tab.id,{'msg':'addXpaths','Xpaths':tobeSent[sender.tab.id]});
      delete tobeSent[sender.tab.id];
    }
  }
}
function processIncomingRespond(respond,sendResponse){

}
function constructYAML(){
  var count = 0;
  var yaml = '';
  console.log(yaml);
  for(var i in pages){
    var yamlObject = {};
    yamlObject.page = {};
    yamlObject.elements = [];
    var pageObjectSelector = '.page-object';
    var pageElement = $(pageObjectSelector).eq(count);
    var pageNameTextBox = pageElement.find('.page-name-textbox');
    yamlObject.page.name = (pageNameTextBox.val() === '')? pageNameTextBox.attr('placeholder') : pageNameTextBox.val();
    var pageURLTextBox = pageElement.find('.page-url-textbox');
    yamlObject.page.url = (pageURLTextBox.val() === '')? pageURLTextBox.attr('placeholder') : pageURLTextBox.val();
    for(var j = 0; j < pages[i].elements.length; j++){
      var elementTextBox = pageElement.find('.element-name-textbox').eq(j);
      var element = {};
      element.name = (elementTextBox.val() === '')? elementTextBox.attr('placeholder') : elementTextBox.val();
      element.xpath = pages[i].elements[j].Xpath;
      yamlObject.elements.push(element);
    }
    var yamlDumped = jsyaml.safeDump(yamlObject);
    yaml += '---\n' + yamlDumped;
    count++;
  }
  yaml+='...';
  var blob = new Blob([yaml], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, 'profile.yaml');

  console.log(yaml);
}
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
      'from a content script:' + sender.tab.url :
      'from the extension');
    console.log(sender.tab);
    processIncomingMessage(request,sender,sendResponse);
  }
  );

function clearPages(callback,arg){
  chrome.tabs.query({},function(tabs){
    for(var i in tabs){
      chrome.tabs.sendMessage(tabs[i].id,{'msg':'removeAllStyles'});
    }
    pages = {};
    pageLength = 0;
    pageCount = 0;
    $('#container').html('');
    if(callback){
      callback(arg);
    }
  });
}
$(function() {
  $('#clear-all-button').click(function(e){
    clearPages();
  });
  $('.elements li').click(function(e){
    $('.elements li').removeClass('active');
    $(this).addClass('active');
  });
  $('#export-button').click(function(e){
    constructYAML();
  });
});

$('#import-file-input').change(function(){
  if($(this).val() === ''){
    return;
  }
  readYAML(this);
});
function onLoadYAML(e){
  var yamlString = e.target.result;
  var result = yamlString.split('---');
  var yamlObject = [];
  for(var i = 1; i < result.length; i++){
    result[i] = '---' + result[i];
    yamlObject.push(jsyaml.load(result[i]));
    addPage(yamlObject[i-1].page.url,yamlObject[i-1].page.name);
    for(var j = 0; j < yamlObject[i-1].elements.length; j++){
      var element = {};
      element.name = yamlObject[i-1].elements[j].name;
      element.Xpath = yamlObject[i-1].elements[j].xpath;
      element.tabId = null;
      addElement(yamlObject[i-1].page.url,element, false);
    }
  }
  console.log(yamlObject);
  var urls = [];
  for(var url in pages){
    urls.push(url);
  }
  chrome.windows.create({'url':urls},function(wind){
    for(var i in wind.tabs){
      var elements = pages[wind.tabs[i].url].elements;
      var Xpaths = [];
      for(var j in elements){
        elements[j].tabId = wind.tabs[i].id;
        Xpaths.push(elements[j].Xpath);
      }
      console.log(Xpaths);
      tobeSent[wind.tabs[i].id] = Xpaths;
    }
  });

}

function readYAML(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      clearPages(onLoadYAML,e);
    };
    reader.readAsText(input.files[0]);

  }
}