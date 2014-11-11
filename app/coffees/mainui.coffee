'use strict'

Page = (tabId, url, name) ->
  @tabId = tabId
  @elements = []
  @name = name
  @url = url
  @active = false
  return
addElement = (pageIndex, element, isUpdateScroll) ->
  page = pages[pageIndex]
  page.elements.push element
  console.log page
  console.log pages
  pageURL = page.url
  elements = page.elements
  if element.comment is undefined
    element.comment = ''
  detailPanelId = 'detail-panel-' + pageIndex + '-' + elements.length;

  html = ''
  html += '<li>'
  html += '<span class=\"element-no\">' + elements.length + '</span>'
  html += '<a href=\"#\" class=\"remove-button remove-element-button\">'
  html += '<i class=\"fa fa-close\"></i>'
  html += '</a>'
  html += '<a class=\"show-detail-button\" data-toggle="collapse" data-parent="" href="#' + detailPanelId + '">'
  html += '<i class=\"fa fa-sort-down\"></i>'
  html += '</a>'
  html += '<input type=\"text\" class=\"element-name-textbox\" placeholder=\"Element name\", value = \"' + element.name + '\">'
  html += '<div id="' + detailPanelId + '" class="detail-panel panel-collapse collapse">'
  html += '<textarea rows="3" class="element-comment-textarea" placeholder="Comment goes here">'+ element.comment + '</textarea>'
  html += '</div>'
  html += '</li>'
  elementsDom = $('.elements').eq(pageIndex)
  elementsDom.append html
  targetElement = $(elementsDom).find('li:last-child .element-name-textbox')
  scrollTo targetElement  if isUpdateScroll
  $(targetElement).focus ->
    Xpath = element.Xpath
    $(elementsDom).siblings('.xpath-text').text Xpath
    $('#xpath-textarea').text Xpath
    return

  elementsDom.find('li').eq(elements.length - 1).mouseenter((e) ->
    chrome.tabs.sendMessage page.tabId,
      msg: 'changeStyleAtXpath'
      Xpath: element.Xpath
      url: pageURL

    return
  ).mouseleave (e) ->
    chrome.tabs.sendMessage page.tabId,
      msg: 'recoverStyleAtXpath'
      Xpath: element.Xpath
      url: pageURL

    return

  elementsDom.find('.element-no').eq(elements.length - 1).click (e) ->
    chrome.tabs.sendMessage page.tabId,
      msg: 'findXpath'
      Xpath: element.Xpath
      url: pageURL

    return

  elementsDom.find('.remove-element-button').eq(elements.length - 1).click (e) ->
    removeButton = this
    elementIndex = $(this).closest('li').index()
    chrome.tabs.sendMessage page.tabId,
      msg: 'removeStyleAtXpath'
      Xpath: element.Xpath
      url: pageURL

    elements.splice pageIndex, 1
    $(removeButton).closest('li').remove()
    elementNumberLabels = $('.element-no')
    i = 0

    while i < elements.length
      elementNumberLabels.eq(i).text i + 1
      i++
    return

  return
scrollTo = (element) ->
  offset = $(element).offset().top - headerHeight
  $('html,body').animate
    scrollTop: offset
  , 'slow', ->
    $(element).focus()
    return

  return
deactivatePage = (index) ->
  pages[index].active = false
  $('.panel-title').eq(index).css 'color', 'red'
  $('.page-object').eq(index).find('.element-no').css 'color', 'red'
  return
activatePage = (index) ->
  pages[index].active = true
  $('.panel-title').eq(index).css 'color', 'black'
  return
addPage = (tabId, pageURL, pageTitle) ->
  pageURL = stripTrailingSlash(pageURL)
  html = ''
  pageCount++
  page = new Page(tabId, pageURL, pageTitle)
  pages.push page
  html += '<div class = \"panel-group page-object\" >'
  html += '<div class = \"panel panel-default\">'
  html += '<div class = \"panel-heading\">'
  html += '<h4 class = \"panel-title\">'
  html += '<a data-toggle = \"collapse\" data-parent = \"\" href = \"#page-content-panel-' + pageCount + '\">'
  html += 'Page #' + pageCount
  html += '</a>'
  html += '<a href=\"#\" class=\"pull-right\">'
  html += '<i class=\"fa fa-close remove-button remove-page-button\"></i>'
  html += '</a>'
  html += '</h4>'
  html += '</div>'
  html += '<div id=\"page-content-panel-' + pageCount + '\" class=\"panel-collapse collapse in\">'
  html += '<div class=\"panel-body\">'
  html += '<div>'
  html += '<input type=\"text\" class=\"page-name-textbox\" placeholder=\"Page Name\" value =\"' + page.name + '\">'
  html += '<input type=\"text\" class=\"page-url-textbox\" placeholder=\"Page URL\" data-url = \"' + pageURL + '\" value =\"' + pageURL + '\">'
  html += '</div>'
  html += '<div class=\"row\">'
  html += '<div class=\"col-sm-6 col-xs-6\">'
  html += '<h5>Elements</h5>'
  html += '</div>'
  html += '<div class=\"col-sm-6 col-xs-6 text-right\">'
  html += '<a href=\"#\" class=\"find-xpath\"><i class=\"fa fa-paint-brush\"></i>&nbsp;&nbsp;Highlight  All in page</a>'
  html += '</div>'
  html += '</div>'
  html += '<ul class=\"elements\">'
  html += '</ul>'
  html += '</div>'
  html += '</div>'
  html += '</div>'
  html += '</div>'
  index = pages.length - 1
  $('#container').append html
  $('.find-xpath').eq(index).click (e) ->
    Xpaths = []
    for j of page.elements
      Xpaths.push page.elements[j].Xpath
    if page.active
      chrome.tabs.sendMessage page.tabId,
        msg: 'findXpaths'
        Xpaths: Xpaths

      chrome.tabs.update page.tabId,
        active: true

    else
      chrome.windows.create
        url: pageURL
      , (wind) ->
        activatePage index
        page.tabId = wind.tabs[0].id
        tobeSent[wind.tabs[0].id] = Xpaths
        return

    return

  $('.page-object').eq(index).find('.remove-page-button').click (e) ->
    removeButton = $(this)
    if page.active
      chrome.tabs.sendMessage page.tabId,
        msg: 'removeAllStyles'

    pages.splice index
    removeButton.closest('.page-object').remove()
    return

  page.active = true
  page
stripTrailingSlash = (str) ->
  return str.substr(0, str.length - 1)  if str.substr(-1) is '/'
  str
processIncomingMessage = (request, sender, sendResponse) ->
  senderURL = stripTrailingSlash(sender.tab.url)
  if request.msg is 'addElement'
    sendResponse msg: 'success'
    element = request.element
    haveTabId = false
    for index of pages
      if pages[index].tabId is sender.tab.id and pages[index].url is senderURL
        addElement index, element, true
        haveTabId = true
        $('.page-object').eq(index).find('.element-no').css 'color', 'green'
    unless haveTabId
      page = addPage(sender.tab.id, senderURL, sender.tab.title)
      addElement pages.length - 1, element, true
      $('.page-object').eq(pages.length - 1).find('.element-no').css 'color', 'green'
  else if request.msg is 'newPage'
    sendResponse msg: 'startExtension'
    if tobeSent[sender.tab.id]
      chrome.tabs.sendMessage sender.tab.id,
        msg: 'findXpaths'
        Xpaths: tobeSent[sender.tab.id]

      delete tobeSent[sender.tab.id]

      return
    for k of pages
      deactivatePage k  if pages[k].tabId is sender.tab.id and pages[k].url isnt senderURL  if pages[k].active
  else if request.msg is 'checkXpath'
    console.log 'checkXpath ' + request.Xpath + ' found = ' + request.found
    for i of pages
      if pages[i].tabId is sender.tab.id and pages[i].url is senderURL
        j = 0

        while j < pages[i].elements.length
          if pages[i].elements[j].Xpath is request.Xpath
            elementsDom = $('.page-object').eq(i).find('.element-no')
            if request.found
              elementsDom.eq(j).css 'color', 'green'
            else
              elementsDom.eq(j).css 'color', 'red'
          j++
  return
processIncomingRespond = (respond, sendResponse) ->
constructYAML = ->
  count = 0
  yaml = ''
  console.log yaml
  for i of pages
    yamlObject = {}
    yamlObject.page = {}
    yamlObject.elements = []
    pageObjectSelector = '.page-object'
    pageElement = $(pageObjectSelector).eq(count)
    pageNameTextBox = pageElement.find('.page-name-textbox')
    yamlObject.page.name = (if (pageNameTextBox.val() is '') then pageNameTextBox.attr('placeholder') else pageNameTextBox.val())
    pageURLTextBox = pageElement.find('.page-url-textbox')
    yamlObject.page.url = (if (pageURLTextBox.val() is '') then pageURLTextBox.attr('placeholder') else pageURLTextBox.val())
    j = 0

    while j < pages[i].elements.length
      elementTextBox = pageElement.find('.element-name-textbox').eq(j)
      element = {}
      element.name = (if (elementTextBox.val() is '') then elementTextBox.attr('placeholder') else elementTextBox.val())
      element.xpath = pages[i].elements[j].Xpath
      comment = pageElement.find('.element-comment-textarea').eq(j).val()
      if comment isnt ''
        element.comment = comment
      yamlObject.elements.push element
      j++
    yamlDumped = jsyaml.safeDump(yamlObject)
    yaml += '---\n' + yamlDumped
    count++
  yaml += '...'
  blob = new Blob([yaml],
    type: 'text/plain;charset=utf-8'
  )
  saveAs blob, 'profile.yaml'
  console.log yaml
  return
clearPages = (callback, arg) ->
  chrome.tabs.query {}, (tabs) ->
    for i of tabs
      chrome.tabs.sendMessage tabs[i].id,
        msg: 'removeAllStyles'

    pages = []
    pageCount = 0
    $('#container').html ''
    callback arg  if callback
    return

  return
onLoadYAML = (e) ->
  yamlString = e.target.result
  result = yamlString.split('---')
  yamlObject = []
  urls = []
  i = 1

  while i < result.length
    result[i] = '---' + result[i]
    yamlObject.push jsyaml.load(result[i])
    yamlObject[i - 1].page.url = stripTrailingSlash(yamlObject[i - 1].page.url)
    urls.push yamlObject[i - 1].page.url
    addPage null, yamlObject[i - 1].page.url, yamlObject[i - 1].page.name
    j = 0

    while j < yamlObject[i - 1].elements.length
      element = {}
      element.name = yamlObject[i - 1].elements[j].name
      element.Xpath = yamlObject[i - 1].elements[j].xpath
      if yamlObject[i - 1].elements[j].comment
        element.comment = yamlObject[i - 1].elements[j].comment
      addElement i - 1, element, false
      j++
    i++
  console.log yamlObject
  chrome.windows.create
    url: urls
  , (wind) ->
    for tab of wind.tabs
      elements = pages[tab].elements
      pages[tab].tabId = wind.tabs[tab].id
      Xpaths = []
      for elem of elements
        Xpaths.push elements[elem].Xpath
      console.log Xpaths
      tobeSent[wind.tabs[tab].id] = Xpaths
    return

  return
readYAML = (input) ->
  if input.files and input.files[0]
    reader = new FileReader()
    reader.onload = (e) ->
      clearPages onLoadYAML, e
      return

    reader.readAsText input.files[0]
  return

pages = []
pageLength = 0
pageCount = 0
bg = chrome.extension.getBackgroundPage()
tobeSent = {}
headerHeight = 100
chrome.tabs.onRemoved.addListener (tabId, removeInfo) ->
  for i of pages
    deactivatePage i  if pages[i].tabId is tabId  if pages[i].active
  return

chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab) ->

chrome.runtime.onMessage.addListener (request, sender, sendResponse) ->
  console.log (if sender.tab then 'from a content script:' + sender.tab.url else 'from the extension')
  processIncomingMessage request, sender, sendResponse
  return

$ ->
  $('#clear-all-button').click (e) ->
    clearPages()
    return

  $('.elements li').click (e) ->
    $('.elements li').removeClass 'active'
    $(this).addClass 'active'
    return

  $('#export-button').click (e) ->
    constructYAML()
    return

  return

$('#import-file-input').change ->
  return  if $(this).val() is ''
  readYAML this
  return

