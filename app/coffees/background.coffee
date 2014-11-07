'use strict'

mainWindow = null

setBadgeText = (text) ->
  chrome.browserAction.setBadgeText text: text
  return
createMainWindow = ->
  return  if mainWindow isnt null
  chrome.windows.create
    url: 'mainui.html'
    type: 'detached_panel'
    focused: true
    top: 40
    left: (screen.width - 480)
    width: 460
    height: 600
  , (chromeWindow) ->
    mainWindow = chromeWindow
    setBadgeText 'on'
    chrome.tabs.query {}, (tabs) ->
      console.log tabs.length
      for i of tabs
        chrome.tabs.sendMessage tabs[i].id,
          msg: 'startExtension'

      return

    return

  return
sendMessageToTab = (id, msg) ->
  chrome.tabs.sendMessage id, msg
  return

mainWindow = null
chrome.runtime.onInstalled.addListener (details) ->
  console.log 'previousVersion', details.previousVersion
  return

chrome.browserAction.setBadgeText text: 'Allo'
chrome.browserAction.onClicked.addListener createMainWindow
chrome.windows.onRemoved.addListener (closedId) ->
  if closedId is mainWindow.id
    setBadgeText 'off'
    if mainWindow
      chrome.tabs.query {}, (tabs) ->
        for i of tabs
          console.log tabs[i]
          chrome.tabs.sendMessage tabs[i].id,
            msg: 'stopExtension'

        return

    mainWindow = null
  return
