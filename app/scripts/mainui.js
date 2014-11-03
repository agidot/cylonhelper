
'use strict';

function Page(tabId,url,name){
  this.tabId = tabId;
  this.elements = [];
  this.name = name;
  this.url = url;
  this.active = false;
}
var pages = [];
var pageLength = 0;
var pageCount = 0;

var bg = chrome.extension.getBackgroundPage();
var tobeSent = {};
function addElement(pageIndex,element,isUpdateScroll){
  var page = pages[pageIndex];
  page.elements.push(element);
  console.log(page);
  console.log(pages);
  var pageURL = page.url;
  var elements = page.elements;
  var html = '';
  html += '<li>';
  html += '<span class="element-no">' + elements.length +'</span>';
  html += '<a href="#" class="remove-button remove-element-button">';
  html += '<i class="fa fa-close"></i>';
  html += '</a>';
  html += '<input type="text" class="element-name-textbox" placeholder="Element name", value = "'+ element.name +'"">';
  html += '</li>';
  var elementsDom = $('.elements').eq(pageIndex);
  elementsDom.append(html);

  var targetElement = $(elementsDom).find('li:last-child .element-name-textbox');
  
  if(isUpdateScroll){
    scrollTo(targetElement);
  }

  $(targetElement).focus(function(){
    var Xpath = element.Xpath;
    $(elementsDom).siblings('.xpath-text').text(Xpath);
  });

  elementsDom.find('li').eq(elements.length-1).mouseenter(function(e){
    chrome.tabs.sendMessage(page.tabId,{'msg':'changeStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
  }).mouseleave(function(e){
    chrome.tabs.sendMessage(page.tabId,{'msg':'recoverStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
  });
  elementsDom.find('.element-no').eq(elements.length-1).click(function(e){
    chrome.tabs.sendMessage(page.tabId,{'msg':'findXpath','Xpath': element.Xpath,'url':pageURL});
  });

  elementsDom.find('.remove-element-button').eq(elements.length-1).click(function(e){
    var removeButton = this;
    var elementIndex = $(this).closest('li').index();
    chrome.tabs.sendMessage(page.tabId,{'msg':'removeStyleAtXpath','Xpath': element.Xpath,'url':pageURL});
    elements.splice(pageIndex,1);
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
function deactivatePage(index){
  pages[index].active = false;
  $('.panel-title').eq(index).css('color', 'red');
  $('.page-object').eq(index).find('.element-no').css('color', 'red');
}
function activatePage(index){
  pages[index].active = true;
  $('.panel-title').eq(index).css('color', 'black');
}
chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
  for(var i in pages){
    if(pages[i].active){
      if(pages[i].tabId === tabId){
        deactivatePage(i);
      }
    }
  }
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
});

function addPage(tabId,pageURL,pageTitle){
  pageURL = stripTrailingSlash(pageURL);
  var html = '';
  pageCount++;
  var page = new Page(tabId,pageURL,pageTitle);
  pages.push(page);

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
  html += '<h5 class ="find-xpath">Elements</h5>';
  html += '<div class="xpath-text">';
  html += '</div>';
  html += '<ul class="elements">';
  html += '</ul>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';


  $('#container').append(html);
  $('.find-xpath').eq(pages.length-1).click(function(e){
    var Xpaths = [];
    for(var j in page.elements){
      Xpaths.push(page.elements[j].Xpath);
    }
    if(page.active){
      chrome.tabs.sendMessage(page.tabId,{'msg':'findXpaths','Xpaths':Xpaths});
      chrome.tabs.update(page.tabId,{'active':true});
    }
    else{
      chrome.windows.create({'url':pageURL},function(wind){
        activatePage(pages.length-1);
        page.tabId = wind.tabs[0].id;
        tobeSent[wind.tabs[0].id] = Xpaths;
      });
    }
  });


  $('.page-object').eq(pages.length-1).find('.remove-page-button').click(function(e){
    var removeButton = $(this);
    if(page.active){
      chrome.tabs.sendMessage(page.tabId,{'msg':'removeAllStyles'});
    }
    pages.splice(removeButton.closest('.page-object').index());
    removeButton.closest('.page-object').remove();
  });
  page.active = true;
  return page;
}

function stripTrailingSlash(str) {
  if(str.substr(-1) === '/') {
    return str.substr(0, str.length - 1);
  }
  return str;
}
function processIncomingMessage(request,sender,sendResponse){
  var senderURL = stripTrailingSlash(sender.tab.url);
  if(request.msg === 'addElement'){
    sendResponse({msg: 'success'});
    var element = request.element;
    var haveTabId = false;
    for(var index in pages){
      if(pages[index].tabId === sender.tab.id && pages[index].url === senderURL){
        addElement(index,element,true);
        haveTabId = true;
        $('.page-object').eq(index).find('.element-no').css('color', 'green');
      }
    }
    if(!haveTabId){
      var page = addPage(sender.tab.id,senderURL,sender.tab.title);
      addElement(pages.length-1,element,true);
      $('.page-object').eq(pages.length-1).find('.element-no').css('color', 'green');
    }
  }
  else if(request.msg === 'newPage'){
    sendResponse({msg:'startExtension'});
    if(tobeSent[sender.tab.id]){
      chrome.tabs.sendMessage(sender.tab.id,{'msg':'findXpaths','Xpaths':tobeSent[sender.tab.id]});
      delete tobeSent[sender.tab.id];
      return;
    }
    for(var k in pages){
      if(pages[k].active){
        if(pages[k].tabId === sender.tab.id && pages[k].url !== senderURL){
          deactivatePage(k);
        }
      }
    }
  }
  else if(request.msg === 'checkXpath'){
    console.log('checkXpath ' + request.Xpath + ' found = ' + request.found);
    for(var i in pages){
      if(pages[i].tabId === sender.tab.id && pages[i].url === senderURL){
        for(var j = 0; j < pages[i].elements.length; j++){
          if(pages[i].elements[j].Xpath === request.Xpath){
            var elementsDom = $('.page-object').eq(i).find('.element-no');
            if(request.found){
              elementsDom.eq(j).css('color', 'green');
            }
            else{
              elementsDom.eq(j).css('color', 'red');
            }
          }
        }
      }
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
    processIncomingMessage(request,sender,sendResponse);
  }
  );

function clearPages(callback,arg){
  chrome.tabs.query({},function(tabs){
    for(var i in tabs){
      chrome.tabs.sendMessage(tabs[i].id,{'msg':'removeAllStyles'});
    }
    pages = [];
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
  var urls = [];
  for(var i = 1; i < result.length; i++){
    result[i] = '---' + result[i];
    yamlObject.push(jsyaml.load(result[i]));
    yamlObject[i-1].page.url = stripTrailingSlash(yamlObject[i-1].page.url);
    urls.push(yamlObject[i-1].page.url);
    addPage(null,yamlObject[i-1].page.url,yamlObject[i-1].page.name);
    for(var j = 0; j < yamlObject[i-1].elements.length; j++){
      var element = {};
      element.name = yamlObject[i-1].elements[j].name;
      element.Xpath = yamlObject[i-1].elements[j].xpath;
      addElement(i-1,element, false);
    }
  }
  console.log(yamlObject);
  chrome.windows.create({'url':urls},function(wind){
    for(var i in wind.tabs){
      var elements = pages[i].elements;
      pages[i].tabId = wind.tabs[i].id;
      var Xpaths = [];
      for(var j in elements){
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