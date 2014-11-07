(function() {
  'use strict';
  var createMainWindow, mainWindow, sendMessageToTab, setBadgeText;

  setBadgeText = function(text) {
    chrome.browserAction.setBadgeText({
      text: text
    });
  };

  createMainWindow = function() {
    if (mainWindow !== null) {
      return;
    }
    chrome.windows.create({
      url: 'mainui.html',
      type: 'detached_panel',
      focused: true,
      top: 40,
      left: screen.width - 480,
      width: 460,
      height: 600
    }, function(chromeWindow) {
      var mainWindow;
      mainWindow = chromeWindow;
      setBadgeText('on');
      chrome.tabs.query({}, function(tabs) {
        var i;
        console.log(tabs.length);
        for (i in tabs) {
          chrome.tabs.sendMessage(tabs[i].id, {
            msg: 'startExtension'
          });
        }
      });
    });
  };

  sendMessageToTab = function(id, msg) {
    chrome.tabs.sendMessage(id, msg);
  };

  mainWindow = null;

  chrome.runtime.onInstalled.addListener(function(details) {
    console.log('previousVersion', details.previousVersion);
  });

  chrome.browserAction.setBadgeText({
    text: 'Allo'
  });

  chrome.browserAction.onClicked.addListener(createMainWindow);

  chrome.windows.onRemoved.addListener(function(closedId) {
    if (closedId === mainWindow.id) {
      setBadgeText('off');
      if (mainWindow) {
        chrome.tabs.query({}, function(tabs) {
          var i;
          for (i in tabs) {
            console.log(tabs[i]);
            chrome.tabs.sendMessage(tabs[i].id, {
              msg: 'stopExtension'
            });
          }
        });
      }
      mainWindow = null;
    }
  });

}).call(this);
