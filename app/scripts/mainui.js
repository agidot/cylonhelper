'use strict';

function Page(url){
  this.elements = [];
  this.name = null;
  this.tabId = null;
  this.urlName = url;
}
var pages = {};
var pageLength = 0;

var bg = chrome.extension.getBackgroundPage();
var tab = null;

function addElement(element){
  pages[tab.url].elements.push(element);
  var elements = pages[tab.url].elements;
  var html = '';
  html += '<li>';
  html += '<span class="element-no">' + elements.length +'</span>';
  html += '<a href="#" class="remove-button remove-element-button">';
  html += '<i class="fa fa-close"></i>';
  html += '</a>';
  html += '<input type="text" class="element-name-textbox" placeholder="Element ' + elements.length +'">';
  html += '</li>';
  var domElements = $('.page-url-textbox').filter(function(index){
    return $(this).attr('placeholder') === tab.url;
  }).closest('.page-object').find('.elements');
  domElements.append(html);

  var targetElement = $(domElements).find('li:last-child .element-name-textbox');
  scrollTo(targetElement);

  $(targetElement).focus(function(){
    var xpath = element.Xpath;
    $('.xpath-text').text(xpath);
  });

  domElements.find('li').mouseenter(function(e){
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

  domElements.find('.remove-element-button').eq(elements.length-1).click(function(e){
    var removeButton = this;
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    var index = $(this).closest('li').index();
    console.log(url);
    console.log(pages[url].tabId);

    chrome.tabs.get(pages[url].tabId,function(targetTab){
      console.log(targetTab);
      if(targetTab !== null){
        if(targetTab.url === url){
          chrome.tabs.sendMessage(pages[url].tabId,{'msg':'removeStyleAtXpath','Xpath': pages[url].elements[index].Xpath});
        }
      }
      pages[url].elements.splice(index,1);
      $(removeButton).closest('li').remove();
    });
  });
}

var headerHeight = 100;
function scrollTo(element){
  var offset = $(element).offset().top - headerHeight;
  $('html,body').animate({scrollTop: offset},'slow', function(){
    $(element).focus();
  });
}

function addPage(){
  var html = '';
  pages[tab.url] = new Page(tab.url);
  var page = pages[tab.url];
  page.name = tab.title;
  page.tabId = tab.id;
  pageLength++;

  html += '<div class = "panel-group page-object" id = "page-object-panel-' + pageLength +'">';
  html += '<div class = "panel panel-default">';
  html += '<div class = "panel-heading">';
  html += '<h4 class = "panel-title">';
  html += '<a data-toggle = "collapse" data-parent = "" href = "#page-content-panel-' + pageLength +'">';
  html += 'Page #' + pageLength;
  html += '</a>';
  html += '<a href="#" class="pull-right">';
  html += '<i class="fa fa-close remove-button remove-page-button"></i>';
  html += '</a>';
  html += '</h4>';
  html += '</div>';
  html += '<div id="page-content-panel-' + pageLength +'" class="panel-collapse collapse in">';
  html += '<div class="panel-body">';
  html += '<div>';
  html += '<input type="text" class="page-name-textbox" placeholder="' + page.name +'">';
  html += '<input type="text" class="page-url-textbox" placeholder="'+ tab.url +'">';
  html += '</div>';
  html += '<h5>Elements</h5>';
  html += '<div class="xpath-text">'
  html += '</div>'
  html += '<ul class="elements">';
  html += '</ul>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  $('#container').append(html);
  $('#page-object-panel-' + pageLength).find('.remove-page-button').click(function(e){
    var removeButton = this;
    var url = $(this).closest('.page-object').find('.page-url-textbox').attr('placeholder');
    console.log(url);
    console.log(pages);
    chrome.tabs.get(pages[url].tabId,function(targetTab){
      if(targetTab !== null){
        if(targetTab.url === url){
          chrome.tabs.sendMessage(pages[url].tabId,{'msg':'removeAllStyles'});
        }
      }
      delete pages[url];
      $(removeButton).closest('.page-object').remove();
    });
  });
}

function processIncomingMessage(request,sendResponse){
  if(request.msg === 'addElement'){
    sendResponse({msg: 'success'});
    var element = request.element;
    console.log(element);
    if(pages[tab.url] === undefined){
      addPage();
    }
    addElement(element);
  }
  else if(request.msg === 'newPage'){
    sendResponse({msg:'startExtension'});
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
    $('#container').html('');
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

  readURL(this);
});

function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
        
    reader.onload = function (e) {
      $('#hidden-div').html(e.target.result);
      console.log(e.target.result);
    };
    
    reader.readAsText(input.files[0]);
  }
}