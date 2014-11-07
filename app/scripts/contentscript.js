(function() {
  'use strict';
  var addCylonHighlight, addCylonHover, changeStyleAtXpath, currentElement, disableKeysBinding, elements, enableKeysBinding, findXpath, getElementByXpath, hoverBorderClass, keysBinding, mouse, processIncomingMessage, processIncomingRespond, recoverStyleAtXpath, removeAllStyles, removeCylonHighlight, removeCylonHover, removeStyleAtXpath, removeStyleFromElement, selectedBorderClass, sendElement, stripTrailingSlash;

  currentElement = null;

  elements = [];

  processIncomingMessage = function(request) {
    var i;
    if (request.url) {
      if (stripTrailingSlash(document.URL) !== request.url) {
        console.log(request.url);
        return;
      }
    }
    console.log(request);
    if (request.msg === 'startExtension') {
      enableKeysBinding();
    } else if (request.msg === 'removeAllStyles') {
      removeAllStyles();
    } else if (request.msg === 'changeStyleAtXpath') {
      changeStyleAtXpath(request.Xpath);
    } else if (request.msg === 'recoverStyleAtXpath') {
      recoverStyleAtXpath(request.Xpath);
    } else if (request.msg === 'removeStyleAtXpath') {
      removeStyleAtXpath(request.Xpath);
    } else if (request.msg === 'stopExtension') {
      disableKeysBinding();
    } else if (request.msg === 'findXpaths') {
      removeAllStyles();
      for (i in request.Xpaths) {
        findXpath(request.Xpaths[i]);
      }
    } else if (request.msg === 'findXpath') {
      removeStyleAtXpath(request.Xpath);
      findXpath(request.Xpath);
      changeStyleAtXpath(request.Xpath);
    }
  };

  stripTrailingSlash = function(str) {
    if (str.substr(-1) === '/') {
      return str.substr(0, str.length - 1);
    }
    return str;
  };

  addCylonHighlight = function(element) {
    if (!$(element).hasClass(selectedBorderClass)) {
      $(element).addClass(selectedBorderClass);
    }
  };

  removeCylonHighlight = function(element) {
    $(element).removeClass(selectedBorderClass);
  };

  addCylonHover = function(element) {
    if (!$(element).hasClass(hoverBorderClass)) {
      $(element).addClass(hoverBorderClass);
    }
  };

  removeCylonHover = function(element) {
    $(element).removeClass(hoverBorderClass);
  };

  findXpath = function(Xpath) {
    var element, elementByXpath, found, i;
    elementByXpath = getElementByXpath(Xpath);
    found = false;
    if (elementByXpath) {
      element = new Element(elementByXpath, Xpath);
      i = 0;
      while (i < elements.length) {
        if (elementByXpath === elements[i].element) {
          found = true;
        }
        i++;
      }
      if (!found) {
        addCylonHighlight(element.element);
        elements.push(element);
        found = true;
      }
    }
    console.log(Xpath);
    console.log(elementByXpath);
    console.log(found);
    chrome.runtime.sendMessage({
      msg: 'checkXpath',
      Xpath: Xpath,
      found: found
    }, function(respond) {
      if (respond) {
        processIncomingRespond(respond);
      }
    });
  };

  getElementByXpath = function(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };

  processIncomingRespond = function(respond) {
    if (respond.msg === 'success') {
      addCylonHighlight(currentElement);
    } else {
      if (respond.msg === 'startExtension') {
        processIncomingMessage(respond);
      }
    }
  };

  sendElement = function(element) {
    var elementToSend;
    elementToSend = {};
    elementToSend.Xpath = element.Xpath;
    elementToSend.name = element.name;
    chrome.runtime.sendMessage({
      msg: 'addElement',
      element: elementToSend
    }, function(respond) {
      if (respond) {
        processIncomingRespond(respond);
      } else {
        console.log('No respond');
      }
    });
  };

  keysBinding = function(e) {
    var element, i;
    if (e.shiftKey) {
      currentElement = document.elementFromPoint(mouse.x, mouse.y);
      element = new Element(currentElement);
      i = 0;
      while (i < elements.length) {
        if (elements[i].element === currentElement) {
          return;
        }
        i++;
      }
      elements.push(element);
      sendElement(element);
    }
  };

  changeStyleAtXpath = function(Xpath) {
    var i;
    for (i in elements) {
      if (elements[i].Xpath === Xpath) {
        $('html, body').stop(true, true).animate({
          scrollTop: $(elements[i].element).offset().top
        }, 200);
        addCylonHover(elements[i].element);
        return true;
      }
    }
    return false;
  };

  recoverStyleAtXpath = function(Xpath) {
    var i;
    for (i in elements) {
      if (elements[i].Xpath === Xpath) {
        removeCylonHover(elements[i].element);
        addCylonHighlight(elements[i].element);
      }
    }
  };

  removeStyleFromElement = function(element) {
    removeCylonHover(element);
    removeCylonHighlight(element);
  };

  removeAllStyles = function() {
    var i;
    for (i in elements) {
      removeCylonHover(elements[i].element);
      removeCylonHighlight(elements[i].element);
    }
    elements = [];
  };

  removeStyleAtXpath = function(Xpath) {
    var i;
    i = 0;
    while (i < elements.length) {
      if (elements[i].Xpath === Xpath) {
        console.log(elements[i].Xpath);
        removeStyleFromElement(elements[i].element);
        elements.splice(i, 1);
        return;
      }
      i++;
    }
  };

  disableKeysBinding = function() {
    $(document).unbind('keydown', keysBinding);
    removeAllStyles();
  };

  enableKeysBinding = function() {
    $(document).keydown(keysBinding);
  };

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log((sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension'));
    processIncomingMessage(request);
  });

  $(function() {
    chrome.runtime.sendMessage({
      msg: 'newPage'
    }, function(respond) {
      if (respond) {
        processIncomingRespond(respond);
      }
    });
  });

  selectedBorderClass = 'cylon-highlight';

  hoverBorderClass = 'cylon-hover';

  mouse = {
    x: 0,
    y: 0
  };

  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX || e.pageX;
    mouse.y = e.clientY || e.pageY;
  }, false);

}).call(this);
