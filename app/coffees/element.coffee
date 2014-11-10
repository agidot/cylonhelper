class window.Element
  constructor : (@element, Xpath) ->
    if Xpath
      @Xpath = Xpath
    else
      @Xpath = @getElementXPath(element)
    @name = @getElementDefaultName(element)

  getElementDefaultName: (element) ->
    $(element).text().replace(/^\s+|\s+$/g, "").substring 0, 50

  getElementTreeXPath: (element) ->
    paths = []
    # Use nodeName (instead of localName) so namespace prefix is included (if any).
    while element and element.nodeType is 1
      index = 0
      sibling = element.previousSibling

      while sibling
        
        # Ignore document type declaration.
        continue  if sibling.nodeType is Node.DOCUMENT_TYPE_NODE
        ++index  if sibling.nodeName is element.nodeName
        sibling = sibling.previousSibling
      tagName = element.nodeName.toLowerCase()
      pathIndex = ((if index then "[" + (index + 1) + "]" else ""))
      paths.splice 0, 0, tagName + pathIndex
      element = element.parentNode
    (if paths.length then "/" + paths.join("/") else null)
  getElementXPath :(element) ->
    if element and element.id
      "//*[@id=\"" + element.id + "\"]"
    else
      @getElementTreeXPath element

