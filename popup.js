var homeUrl = "";

(function(){	
	var app = angular.module("stash", []).config( [
		'$compileProvider',
		function( $compileProvider )
		{   
			$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/)
			// Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
		}
	]);
	
	app.service("stashServerUrlService", function($q){			
		this.getServerUrl = function(){
			var deferred = $q.defer();
			chrome.extension.sendRequest({serverUrl: 'foo'}, function(response) {
				if(response.serverUrl != ""){
					deferred.resolve(response.serverUrl);
				}else{
					deferred.reject("cannot resolve server url");
				}					
			});
			return deferred.promise;
		}
	});
	
	app.controller("StashApprovalController", ["$http", "stashServerUrlService", function($http, stashServerUrlService){
		var stash = this;
		stash.isError = false;
		stash.isLoading = true;
		stash.loadingGifSrc = chrome.extension.getURL("images/ajax-loader.gif");
		stash.error = "";
		stash.optionUrl = chrome.extension.getURL("options.html");
		
		stashServerUrlService.getServerUrl().then(function(serverUrl){
			stash.homeUrl = serverUrl;
			$http.get(stash.homeUrl + "/rest/inbox/latest/pull-requests?role=reviewer&start=0&limit=10&state=OPEN&order=oldest").
			success(function(data){
				stash.approvals = data.values;
			}).
			error(function(data)
			{
				stash.isError = true;
			}).
			finally(function(){
				stash.isLoading = false;
			});
		}, function(reason){
			stash.error = "Server url is empty. Please check server url in option page";
			stash.isLoading = false;
		});		
	}]);
	
	app.controller("StashRequestController", ["$http", "stashServerUrlService", function($http, stashServerUrlService){
		var stash = this;
		stash.isError = false;
		stash.isLoading = true;
		stash.approver = "";
		stash.error = "";
		stash.optionUrl = chrome.extension.getURL("options.html");
		stash.loadingGifSrc = chrome.extension.getURL("images/ajax-loader.gif");
		stashServerUrlService.getServerUrl().then(function(serverUrl){
			stash.homeUrl = serverUrl;
			$http.get(stash.homeUrl + "/rest/inbox/latest/pull-requests?role=author&start=0&limit=10&state=OPEN&order=oldest").
			success(function(data){
				stash.requests = data.values;
			}).
			error(function(data)
			{
				stash.isError = true;
			}).
			finally(function(){
				stash.isLoading = false;
			});
		}, function(reason){
			stash.error = "Server url is empty. Please check server url in option page";
			stash.isLoading = false;
		});
	}]);
	
	app.controller("VersionController", function(){
		this.version = chrome.runtime.getManifest().version;
	});	
})();

$(document).ready(function() {
	$('body').on('click', 'a', function(){
		chrome.tabs.create({url: $(this).attr('href')});
		return false;
	});
	//$("#loadingGif").attr("src", chrome.extension.getURL("images/ajax-loader.gif"));
});
