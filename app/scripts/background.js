'use strict';

var mainWindow = null;


chrome.runtime.onInstalled.addListener(function(details){
	console.log('previousVersion', details.previousVersion);
});
function setBadgeText(text){
	chrome.browserAction.setBadgeText({'text':text});
}

function createMainWindow(){

	if(mainWindow !== null){
		return;
	}
	chrome.windows.create({
		'url': 'mainui.html',
		'type': 'detached_panel',
		'focused': true,
		'top' : 40,
		'left' : (screen.width-480),
		'width' : 460,
		'height' : 600
	},function(chromeWindow){
		mainWindow = chromeWindow;
		setBadgeText('on');
		chrome.tabs.query({},function(tabs){
			console.log(tabs.length);
			for(var i in tabs){
				chrome.tabs.sendMessage(tabs[i].id,{'msg':'startExtension'});
			}
		});
	});
}

chrome.browserAction.setBadgeText({text: '\'Allo'});
chrome.browserAction.onClicked.addListener(createMainWindow);
chrome.windows.onRemoved.addListener(function(closedId){
	if(closedId === mainWindow.id){
		setBadgeText('off');
		if(mainWindow){
			chrome.tabs.query({},function(tabs){
				for(var i in tabs){
					console.log(tabs[i]);
					chrome.tabs.sendMessage(tabs[i].id,{'msg':'stopExtension'});
				}
			});
		}
		mainWindow = null;
	}
});

