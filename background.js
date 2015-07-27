var interval = 10 * 1000
var count = 0;
var notifications = {};
var maxchar = 30;
var homeUrl = "";
var approvals = {};
var intervalId = "";

var opt = {
	type: "basic",
	title: "Stash ",
	message: "New pull request",
	iconUrl: "icon.png",
	eventTime: Date.now(),
	buttons: []
}

var approvalopt = {
	type: "basic",
	title: "Stash ",
	message: "",
	iconUrl: "icon.png",
	eventTime: Date.now(),
	buttons: []
}

var messageopt = {
	type: "basic",
	title: "Message",
	iconUrl: "icon.png",
	message: "",
	eventTime: Date.now(),
	buttons: []
}

function getNotificationId() {
  var id = Math.floor(Math.random() * 9007199254740992) + 1;
  return id.toString();
}

function goToStash(url){  
  chrome.tabs.create({ url: homeUrl + url, active: true }, function(tab){
	  chrome.windows.update(tab.windowId, {focused: true});
  });
  //window.focus();
}

function showNotification(){
	$.get( homeUrl + "/rest/inbox/latest/pull-requests/count", function( data ) {
	  //alert( "Load was performed." );
		if( data.count > 0){
			chrome.browserAction.setBadgeText({ text: data.count.toString() });
			if( data.count > count){
				var url = homeUrl + "/rest/inbox/latest/pull-requests?role=reviewer&start=0&state=OPEN&order=oldest";
				$.get(url, function(data){					
					$(data.values).each(function(index, item){
						var notificationId = getNotificationId();
						notifications[notificationId] = item;						
						opt.buttons.push({title: "Go [" + item.toRef.displayId + "][" + item.description + "]"});
						var dt = new Date();
						opt.title = "Stash " + dt.getHours() + ":" + ("0" + dt.getMinutes()).slice(-2) + ":" + ("0" + dt.getSeconds()).slice(-2);
						chrome.notifications.create(notificationId, opt, function() {});
						opt.buttons = [];
					});
				});
			}
		}else{
			chrome.browserAction.setBadgeText({ text: "" });
		}
		count = data.count;
	});
	
	$.get(homeUrl + "/rest/inbox/latest/pull-requests?role=author&start=0&state=OPEN&order=oldest", function(data){
		if( $(data.values).length > 0 ){
			$(data.values).each(function(index, item){
				if(typeof(approvals[item.id]) == "undefined"){
					approvals[item.id] = [];
				}
				var approver = "";
				$(item.reviewers).each(function(index, user){					
					if(user.approved){
						if(approvals[item.id].indexOf(user.user.slug) == -1){
							var notificationId = getNotificationId();
							notifications[notificationId] = item;
							approver += user.user.slug + " ";
							approvalopt.message = truncateString(item.description, maxchar) + " is approved by " + approver;
							approvalopt.buttons.push({title: "Go [" + item.toRef.displayId + "][" + item.description + "]"});
							chrome.notifications.create(notificationId, approvalopt, function() {});
							approvals[item.id].push(user.user.slug);
							approvalopt.buttons = [];
						}
					}
				});				
			});
		}
	});
}

function truncateString(str, length) {
 return str.length > length ? str.substring(0, length - 3) + '...' : str
}

function goBtnClick(notificationId, buttonIndex){
	goToStash(notifications[notificationId].link.url);
	chrome.notifications.clear(notificationId, function(wasCleared){});
}

function onClosedHandler(notificationId, byUser){
	delete notifications[notificationId];
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for(key in changes)
	{
		if(key == "stashServerUrl")
		{
			homeUrl = changes[key].newValue;
		}
		else if(key == "intervalValue")
		{
			interval = changes[key].newValue * 1000;
			if(intervalId != ""){
				clearInterval(intervalId);
			}
			intervalId = setInterval(showNotification, interval);
		}
	}
});


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.serverUrl) {
    sendResponse({serverUrl: homeUrl});
  } else {
    sendResponse({});
  }
});

function goToStashHome(info)
{
	chrome.tabs.create({url: homeUrl})
}

chrome.storage.local.get('intervalValue', function(items){
	if(typeof items.intervalValue != "undefined"){
		interval = items.intervalValue * 1000;
	}
	chrome.storage.local.get('stashServerUrl', function(items){
		if(typeof items.stashServerUrl != "undefined"){
			homeUrl = items.stashServerUrl;
		}
		chrome.notifications.onButtonClicked.addListener(goBtnClick);
		chrome.notifications.onClosed.addListener(onClosedHandler);
		chrome.contextMenus.create({title: "Go to stash", contexts:["browser_action"], onclick: goToStashHome});
		showNotification();
		if(homeUrl != ""){
			intervalId = setInterval(showNotification, interval);
		}
	});
});


