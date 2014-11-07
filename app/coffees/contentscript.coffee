'use strict'

currentElement = null
elements = []

processIncomingMessage = (request) ->
  if request.url
    if stripTrailingSlash(document.URL) isnt request.url
      console.log request.url
      return
  console.log request
  if request.msg is 'startExtension'
    enableKeysBinding()
  else if request.msg is 'removeAllStyles'
    removeAllStyles()
  else if request.msg is 'changeStyleAtXpath'
    changeStyleAtXpath request.Xpath
  else if request.msg is 'recoverStyleAtXpath'
    recoverStyleAtXpath request.Xpath
  else if request.msg is 'removeStyleAtXpath'
    removeStyleAtXpath request.Xpath
  else if request.msg is 'stopExtension'
    disableKeysBinding()
  else if request.msg is 'findXpaths'
    removeAllStyles()
    for i of request.Xpaths
      findXpath request.Xpaths[i]
  else if request.msg is 'findXpath'
    removeStyleAtXpath request.Xpath
    findXpath request.Xpath
    changeStyleAtXpath request.Xpath
  return
stripTrailingSlash = (str) ->
  return str.substr(0, str.length - 1)  if str.substr(-1) is '/'
  str
addCylonHighlight = (element) ->
  $(element).addClass selectedBorderClass  unless $(element).hasClass(selectedBorderClass)
  return
removeCylonHighlight = (element) ->
  $(element).removeClass selectedBorderClass
  return
addCylonHover = (element) ->
  $(element).addClass hoverBorderClass  unless $(element).hasClass(hoverBorderClass)
  return
removeCylonHover = (element) ->
  $(element).removeClass hoverBorderClass
  return
findXpath = (Xpath) ->
  elementByXpath = getElementByXpath(Xpath)
  found = false
  if elementByXpath
    element = new Element(elementByXpath, Xpath)
    i = 0

    while i < elements.length
      found = true  if elementByXpath is elements[i].element
      i++
    unless found
      addCylonHighlight element.element
      elements.push element
      found = true
  console.log Xpath
  console.log elementByXpath
  console.log found
  chrome.runtime.sendMessage
    msg: 'checkXpath'
    Xpath: Xpath
    found: found
  , (respond) ->
    processIncomingRespond respond  if respond
    return

  return
getElementByXpath = (path) ->
  document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
processIncomingRespond = (respond) ->
  if respond.msg is 'success'
    addCylonHighlight currentElement
  else processIncomingMessage respond  if respond.msg is 'startExtension'
  return
sendElement = (element) ->
  elementToSend = {}
  elementToSend.Xpath = element.Xpath
  elementToSend.name = element.name
  chrome.runtime.sendMessage
    msg: 'addElement'
    element: elementToSend
  , (respond) ->
    if respond
      processIncomingRespond respond
    else
      console.log 'No respond'
    return

  return
keysBinding = (e) ->
  if e.shiftKey
    currentElement = document.elementFromPoint(mouse.x, mouse.y)
    element = new Element(currentElement)
    i = 0

    while i < elements.length
      return  if elements[i].element is currentElement
      i++
    elements.push element
    sendElement element
  return
changeStyleAtXpath = (Xpath) ->
  for i of elements
    if elements[i].Xpath is Xpath
      $('html, body').stop(true, true).animate
        scrollTop: $(elements[i].element).offset().top
      , 200
      addCylonHover elements[i].element
      return true
  false
recoverStyleAtXpath = (Xpath) ->
  for i of elements
    if elements[i].Xpath is Xpath
      removeCylonHover elements[i].element
      addCylonHighlight elements[i].element
  return
removeStyleFromElement = (element) ->
  removeCylonHover element
  removeCylonHighlight element
  return
removeAllStyles = ->
  for i of elements
    removeCylonHover elements[i].element
    removeCylonHighlight elements[i].element
  elements = []
  return
removeStyleAtXpath = (Xpath) ->
  i = 0

  while i < elements.length
    if elements[i].Xpath is Xpath
      console.log elements[i].Xpath
      removeStyleFromElement elements[i].element
      elements.splice i, 1
      return
    i++
  return
disableKeysBinding = ->
  $(document).unbind 'keydown', keysBinding
  removeAllStyles()
  return
enableKeysBinding = ->
  $(document).keydown keysBinding
  return

chrome.runtime.onMessage.addListener (request, sender, sendResponse) ->
  console.log (if sender.tab then 'from a content script:' + sender.tab.url else 'from the extension')
  processIncomingMessage request
  return

$ ->
  chrome.runtime.sendMessage
    msg: 'newPage'
  , (respond) ->
    processIncomingRespond respond  if respond
    return

  return

selectedBorderClass = 'cylon-highlight'
hoverBorderClass = 'cylon-hover'
mouse =
  x: 0
  y: 0

document.addEventListener 'mousemove', (e) ->
  mouse.x = e.clientX or e.pageX
  mouse.y = e.clientY or e.pageY
  return
, false