'use strict';
var Xpaths = [];
var bg = chrome.extension.getBackgroundPage();
function renderXpaths(){
	$('.XpathList').empty();
	for(var i = 0; i < Xpaths.length; i++){
		console.log(i);
		$('.XpathList').append('<li><div>' + Xpaths[i] + '</li>');
	}
	//$('ul.XPathList li').click(function(e){
	//	deleteXPath($(this).text());
	//});

/*
<li>
	<div>
		<input type="text" value="tset"><br>
		<span></span><br>
		<div style="">
			<a href="#">Edit</a>
		</div>
	</div>
</li>
*/
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			'from a content script:' + sender.tab.url :
			'from the extension');
		if(request.msg === 'addXpath'){
			Xpaths.push(request.Xpath);
			console.log(Xpaths);
			renderXpaths();
		}
		sendResponse({msg: 'success'});
	});
$(function() {
	$('#clearButton').click(function(e){
		console.log('dog');
	});
});
