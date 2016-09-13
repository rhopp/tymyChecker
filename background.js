// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var lastUnreadPosts="0";
var maxTries = 3;
var triesCounter = 0;


// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
   chrome.tabs.create({ url: "http://brno.tymy.cz" });
});

chrome.alarms.onAlarm.addListener(function() {
	callURL("discussions/withNew", showResults);
});

function login(path, callback){
	$.when(getCredentials()).then(function(items){
		$.ajax({
			url:"http://brno.tymy.cz/api/login/"+items.tymyUsername+"/"+items.tymyPassword,
			type:'GET',
			success: function(data){
					setSessionKey(data, path, callback);
				},
			error: showErrorForAjaxRequest
		});
	});
}

function getCredentials(){
	return getFromSyncStorage(["tymyUsername","tymyPassword"]);
}

function callURL(path, callback){
	if (triesCounter>maxTries){
		console.log("Max tries reached!");
		triesCounter = 0;
		chrome.storage.local.remove("sessionKey");
		return;
	}
	triesCounter++;
	$.when(getFromLocalStorage("sessionKey")).then(function(sessionKey){
		if ($.isEmptyObject(sessionKey)){
			login(path, callback);
			//callURLWithSessionKey(path, callback);
		}else{
			callURLWithSessionKey(path, callback, sessionKey);
		}
	});
}

//this function expects sessionKey to be present. It does not have to be valid.
function callURLWithSessionKey(path, callback, sessionKey){
	var completeURL = "http://brno.tymy.cz/api/"+path+"?TSID="+sessionKey.sessionKey;
	$.ajax({
		url: completeURL,
		type:'GET',
		success: callback,
		error: function(data){
			//Call to URL was somehow unsuccessful. Log the attempt and try to login again (to get fresh TSID)
			console.log("Unable to call url: "+completeURL);
			console.log(data);
			console.log("Trying to login again to gain new TSID");
			login(path, callback);
		}
	});
}

function setSessionKey(data, path, callback){
	if (data.status == "OK"){
		console.log("Setting sessionKey: ");
		console.log(data);
		chrome.storage.local.set({"sessionKey": data.sessionKey}, function(){
			//sessionKey is fresh -> now we can call the URL again
			callURL(path, callback);
		});
	}else{
		showError(data.status, data.statusMessage);
	}
}

function showErrorForAjaxRequest(xhr, ajaxOptions, thrownError){
	showError(xhr.status, thrownError);
}

function showError(title, message){
	chrome.browserAction.setBadgeText({text: "X"});
	chrome.browserAction.setTitle({title: message});
}


function showResults(data){
	//success = reset tries counter
	triesCounter=0;
 	var newPosts = 0;
 	var discussions = data.data;
 	for (i = 0; i<discussions.length; i++){
 		if (discussions[i].newInfo){
 			newPosts += discussions[i].newInfo.newsCount;	
 		}
 	}
 	if (newPosts>0){
	  if (newPosts != lastUnreadPosts){
		chrome.browserAction.setBadgeText({text: newPosts.toString()});
		if (newPosts != ""){ 
		  var opt = {
			type: "basic",
			title: "brno.tymy.cz",
			message: "Nove zpravy na tymech!",
			iconUrl: "Left_Overs_128x128.png"
		  }
		chrome.notifications.create("brnoTymyNotif"+Math.floor((Math.random() * 99999999) + 1), opt);
	   }
	   lastUnreadPosts = newPosts;
	  }
 	}else{
 		chrome.browserAction.setBadgeText({text: ""});
 	}
}

function getFromSyncStorage(items){
	var deferred = $.Deferred();
	chrome.storage.sync.get(items, function(retrievedItems){
		deferred.resolve(retrievedItems);
	});
	return deferred.promise();
}

function getFromLocalStorage(items){
		var deferred = $.Deferred();
	chrome.storage.local.get(items, function(retrievedItems){
		deferred.resolve(retrievedItems);
	});
	return deferred.promise();
}

function getTitle(data){
  var title = $(data).filter("title").text();
  console.log(title);
  var newPosts = parseNewposts(title);
  console.log(newPosts);
  chrome.browserAction.setBadgeText({text: newPosts});
}

chrome.runtime.onInstalled.addListener(function(details){
   chrome.alarms.create({periodInMinutes: 1});
   chrome.notifications.onClicked.addListener(function(notificationId, byUser){
     chrome.tabs.create({ url: "http://brno.tymy.cz" });
   });
});

