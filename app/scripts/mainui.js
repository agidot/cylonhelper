(function() {
  'use strict';
  var Page, activatePage, addElement, addPage, bg, clearPages, constructYAML, deactivatePage, headerHeight, onLoadYAML, pageCount, pageLength, pages, processIncomingMessage, processIncomingRespond, readYAML, scrollTo, stripTrailingSlash, tobeSent;

  Page = function(tabId, url, name) {
    this.tabId = tabId;
    this.elements = [];
    this.name = name;
    this.url = url;
    this.active = false;
  };

  addElement = function(pageIndex, element, isUpdateScroll) {
    var detailPanelId, elements, elementsDom, html, page, pageURL, targetElement;
    page = pages[pageIndex];
    page.elements.push(element);
    console.log(page);
    console.log(pages);
    pageURL = page.url;
    elements = page.elements;
    detailPanelId = 'detail-panel-' + pageIndex + '-' + elements.length;
    html = '';
    html += '<li>';
    html += '<span class=\"element-no\">' + elements.length + '</span>';
    html += '<a href=\"#\" class=\"remove-button remove-element-button\">';
    html += '<i class=\"fa fa-close\"></i>';
    html += '</a>';
    html += '<a class=\"show-detail-button\" data-toggle="collapse" data-parent="" href="#' + detailPanelId + '">';
    html += '<i class=\"fa fa-sort-down\"></i>';
    html += '</a>';
    html += '<input type=\"text\" class=\"element-name-textbox\" placeholder=\"Element name\", value = \"' + element.name + '\">';
    html += '<div id="' + detailPanelId + '" class="detail-panel panel-collapse collapse">';
    html += '<textarea rows="3" class="element-comment-textarea" placeholder="Comment goes here"></textarea>';
    html += '</div>';
    html += '</li>';
    elementsDom = $('.elements').eq(pageIndex);
    elementsDom.append(html);
    targetElement = $(elementsDom).find('li:last-child .element-name-textbox');
    if (isUpdateScroll) {
      scrollTo(targetElement);
    }
    $(targetElement).focus(function() {
      var Xpath;
      Xpath = element.Xpath;
      $(elementsDom).siblings('.xpath-text').text(Xpath);
      $('#xpath-textarea').text(Xpath);
    });
    elementsDom.find('li').eq(elements.length - 1).mouseenter(function(e) {
      chrome.tabs.sendMessage(page.tabId, {
        msg: 'changeStyleAtXpath',
        Xpath: element.Xpath,
        url: pageURL
      });
    }).mouseleave(function(e) {
      chrome.tabs.sendMessage(page.tabId, {
        msg: 'recoverStyleAtXpath',
        Xpath: element.Xpath,
        url: pageURL
      });
    });
    elementsDom.find('.element-no').eq(elements.length - 1).click(function(e) {
      chrome.tabs.sendMessage(page.tabId, {
        msg: 'findXpath',
        Xpath: element.Xpath,
        url: pageURL
      });
    });
    elementsDom.find('.remove-element-button').eq(elements.length - 1).click(function(e) {
      var elementIndex, elementNumberLabels, i, removeButton;
      removeButton = this;
      elementIndex = $(this).closest('li').index();
      chrome.tabs.sendMessage(page.tabId, {
        msg: 'removeStyleAtXpath',
        Xpath: element.Xpath,
        url: pageURL
      });
      elements.splice(pageIndex, 1);
      $(removeButton).closest('li').remove();
      elementNumberLabels = $('.element-no');
      i = 0;
      while (i < elements.length) {
        elementNumberLabels.eq(i).text(i + 1);
        i++;
      }
    });
  };

  scrollTo = function(element) {
    var offset;
    offset = $(element).offset().top - headerHeight;
    $('html,body').animate({
      scrollTop: offset
    }, 'slow', function() {
      $(element).focus();
    });
  };

  deactivatePage = function(index) {
    pages[index].active = false;
    $('.panel-title').eq(index).css('color', 'red');
    $('.page-object').eq(index).find('.element-no').css('color', 'red');
  };

  activatePage = function(index) {
    pages[index].active = true;
    $('.panel-title').eq(index).css('color', 'black');
  };

  addPage = function(tabId, pageURL, pageTitle) {
    var html, index, page;
    pageURL = stripTrailingSlash(pageURL);
    html = '';
    pageCount++;
    page = new Page(tabId, pageURL, pageTitle);
    pages.push(page);
    html += '<div class = \"panel-group page-object\" >';
    html += '<div class = \"panel panel-default\">';
    html += '<div class = \"panel-heading\">';
    html += '<h4 class = \"panel-title\">';
    html += '<a data-toggle = \"collapse\" data-parent = \"\" href = \"#page-content-panel-' + pageCount + '\">';
    html += 'Page #' + pageCount;
    html += '</a>';
    html += '<a href=\"#\" class=\"pull-right\">';
    html += '<i class=\"fa fa-close remove-button remove-page-button\"></i>';
    html += '</a>';
    html += '</h4>';
    html += '</div>';
    html += '<div id=\"page-content-panel-' + pageCount + '\" class=\"panel-collapse collapse in\">';
    html += '<div class=\"panel-body\">';
    html += '<div>';
    html += '<input type=\"text\" class=\"page-name-textbox\" placeholder=\"Page Name\" value =\"' + page.name + '\">';
    html += '<input type=\"text\" class=\"page-url-textbox\" placeholder=\"Page URL\" data-url = \"' + pageURL + '\" value =\"' + pageURL + '\">';
    html += '</div>';
    html += '<div class=\"row\">';
    html += '<div class=\"col-sm-6 col-xs-6\">';
    html += '<h5>Elements</h5>';
    html += '</div>';
    html += '<div class=\"col-sm-6 col-xs-6 text-right\">';
    html += '<a href=\"#\" class=\"find-xpath\"><i class=\"fa fa-paint-brush\"></i>&nbsp;&nbsp;Highlight  All in page</a>';
    html += '</div>';
    html += '</div>';
    html += '<ul class=\"elements\">';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    index = pages.length - 1;
    $('#container').append(html);
    $('.find-xpath').eq(index).click(function(e) {
      var Xpaths, j;
      Xpaths = [];
      for (j in page.elements) {
        Xpaths.push(page.elements[j].Xpath);
      }
      if (page.active) {
        chrome.tabs.sendMessage(page.tabId, {
          msg: 'findXpaths',
          Xpaths: Xpaths
        });
        chrome.tabs.update(page.tabId, {
          active: true
        });
      } else {
        chrome.windows.create({
          url: pageURL
        }, function(wind) {
          activatePage(index);
          page.tabId = wind.tabs[0].id;
          tobeSent[wind.tabs[0].id] = Xpaths;
        });
      }
    });
    $('.page-object').eq(index).find('.remove-page-button').click(function(e) {
      var removeButton;
      removeButton = $(this);
      if (page.active) {
        chrome.tabs.sendMessage(page.tabId, {
          msg: 'removeAllStyles'
        });
      }
      pages.splice(index);
      removeButton.closest('.page-object').remove();
    });
    page.active = true;
    return page;
  };

  stripTrailingSlash = function(str) {
    if (str.substr(-1) === '/') {
      return str.substr(0, str.length - 1);
    }
    return str;
  };

  processIncomingMessage = function(request, sender, sendResponse) {
    var element, elementsDom, haveTabId, i, index, j, k, page, senderURL;
    senderURL = stripTrailingSlash(sender.tab.url);
    if (request.msg === 'addElement') {
      sendResponse({
        msg: 'success'
      });
      element = request.element;
      haveTabId = false;
      for (index in pages) {
        if (pages[index].tabId === sender.tab.id && pages[index].url === senderURL) {
          addElement(index, element, true);
          haveTabId = true;
          $('.page-object').eq(index).find('.element-no').css('color', 'green');
        }
      }
      if (!haveTabId) {
        page = addPage(sender.tab.id, senderURL, sender.tab.title);
        addElement(pages.length - 1, element, true);
        $('.page-object').eq(pages.length - 1).find('.element-no').css('color', 'green');
      }
    } else if (request.msg === 'newPage') {
      sendResponse({
        msg: 'startExtension'
      });
      if (tobeSent[sender.tab.id]) {
        chrome.tabs.sendMessage(sender.tab.id, {
          msg: 'findXpaths',
          Xpaths: tobeSent[sender.tab.id]
        });
        delete tobeSent[sender.tab.id];
        return;
      }
      for (k in pages) {
        if (pages[k].active) {
          if (pages[k].tabId === sender.tab.id && pages[k].url !== senderURL) {
            deactivatePage(k);
          }
        }
      }
    } else if (request.msg === 'checkXpath') {
      console.log('checkXpath ' + request.Xpath + ' found = ' + request.found);
      for (i in pages) {
        if (pages[i].tabId === sender.tab.id && pages[i].url === senderURL) {
          j = 0;
          while (j < pages[i].elements.length) {
            if (pages[i].elements[j].Xpath === request.Xpath) {
              elementsDom = $('.page-object').eq(i).find('.element-no');
              if (request.found) {
                elementsDom.eq(j).css('color', 'green');
              } else {
                elementsDom.eq(j).css('color', 'red');
              }
            }
            j++;
          }
        }
      }
    }
  };

  processIncomingRespond = function(respond, sendResponse) {};

  constructYAML = function() {
    var blob, count, element, elementTextBox, i, j, pageElement, pageNameTextBox, pageObjectSelector, pageURLTextBox, yaml, yamlDumped, yamlObject;
    count = 0;
    yaml = '';
    console.log(yaml);
    for (i in pages) {
      yamlObject = {};
      yamlObject.page = {};
      yamlObject.elements = [];
      pageObjectSelector = '.page-object';
      pageElement = $(pageObjectSelector).eq(count);
      pageNameTextBox = pageElement.find('.page-name-textbox');
      yamlObject.page.name = (pageNameTextBox.val() === '' ? pageNameTextBox.attr('placeholder') : pageNameTextBox.val());
      pageURLTextBox = pageElement.find('.page-url-textbox');
      yamlObject.page.url = (pageURLTextBox.val() === '' ? pageURLTextBox.attr('placeholder') : pageURLTextBox.val());
      j = 0;
      while (j < pages[i].elements.length) {
        elementTextBox = pageElement.find('.element-name-textbox').eq(j);
        element = {};
        element.name = (elementTextBox.val() === '' ? elementTextBox.attr('placeholder') : elementTextBox.val());
        element.xpath = pages[i].elements[j].Xpath;
        yamlObject.elements.push(element);
        j++;
      }
      yamlDumped = jsyaml.safeDump(yamlObject);
      yaml += '---\n' + yamlDumped;
      count++;
    }
    yaml += '...';
    blob = new Blob([yaml], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, 'profile.yaml');
    console.log(yaml);
  };

  clearPages = function(callback, arg) {
    chrome.tabs.query({}, function(tabs) {
      var i, pageCount, pages;
      for (i in tabs) {
        chrome.tabs.sendMessage(tabs[i].id, {
          msg: 'removeAllStyles'
        });
      }
      pages = [];
      pageCount = 0;
      $('#container').html('');
      if (callback) {
        callback(arg);
      }
    });
  };

  onLoadYAML = function(e) {
    var element, i, j, result, urls, yamlObject, yamlString;
    yamlString = e.target.result;
    result = yamlString.split('---');
    yamlObject = [];
    urls = [];
    i = 1;
    while (i < result.length) {
      result[i] = '---' + result[i];
      yamlObject.push(jsyaml.load(result[i]));
      yamlObject[i - 1].page.url = stripTrailingSlash(yamlObject[i - 1].page.url);
      urls.push(yamlObject[i - 1].page.url);
      addPage(null, yamlObject[i - 1].page.url, yamlObject[i - 1].page.name);
      j = 0;
      while (j < yamlObject[i - 1].elements.length) {
        element = {};
        element.name = yamlObject[i - 1].elements[j].name;
        element.Xpath = yamlObject[i - 1].elements[j].xpath;
        addElement(i - 1, element, false);
        j++;
      }
      i++;
    }
    console.log(yamlObject);
    chrome.windows.create({
      url: urls
    }, function(wind) {
      var Xpaths, elem, elements, tab;
      for (tab in wind.tabs) {
        elements = pages[tab].elements;
        pages[tab].tabId = wind.tabs[tab].id;
        Xpaths = [];
        for (elem in elements) {
          Xpaths.push(elements[elem].Xpath);
        }
        console.log(Xpaths);
        tobeSent[wind.tabs[tab].id] = Xpaths;
      }
    });
  };

  readYAML = function(input) {
    var reader;
    if (input.files && input.files[0]) {
      reader = new FileReader();
      reader.onload = function(e) {
        clearPages(onLoadYAML, e);
      };
      reader.readAsText(input.files[0]);
    }
  };

  pages = [];

  pageLength = 0;

  pageCount = 0;

  bg = chrome.extension.getBackgroundPage();

  tobeSent = {};

  headerHeight = 100;

  chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    var i;
    for (i in pages) {
      if (pages[i].active) {
        if (pages[i].tabId === tabId) {
          deactivatePage(i);
        }
      }
    }
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {});

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log((sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension'));
    processIncomingMessage(request, sender, sendResponse);
  });

  $(function() {
    $('#clear-all-button').click(function(e) {
      clearPages();
    });
    $('.elements li').click(function(e) {
      $('.elements li').removeClass('active');
      $(this).addClass('active');
    });
    $('#export-button').click(function(e) {
      constructYAML();
    });
  });

  $('#import-file-input').change(function() {
    if ($(this).val() === '') {
      return;
    }
    readYAML(this);
  });

}).call(this);
