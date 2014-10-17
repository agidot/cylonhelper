'use strict';

console.log('\'Allo \'Allo! Popup');
var bg = chrome.extension.getBackgroundPage();

$(function() {
	$('#mainButton').click(function(e){
		console.log(bg);
		if(bg.mainWindow === null){
			bg.createMainWindow();
		}
		chrome.runtime.sendMessage({greeting: 'hello'}, function(response) {
		  console.log(response.farewell);
		});
	});

});
