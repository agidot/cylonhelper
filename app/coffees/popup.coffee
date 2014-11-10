"use strict"
console.log "'Allo 'Allo! Popup"
bg = chrome.extension.getBackgroundPage()
$ ->
  $("#mainButton").click (e) ->
    console.log bg
    bg.createMainWindow()  if bg.mainWindow is null
    chrome.runtime.sendMessage
      greeting: "hello"
    , (response) ->
      console.log response.farewell
      return

    return

  return

