$(document).ready(function() {
	
	$('#saveMessage').hide();
	
	$('#save').click(function(){
		chrome.storage.local.set({'intervalValue': $("#intervalValue").val()});
		chrome.storage.sync.set({'intervalValue': $("#intervalValue").val()}, function(){});
		chrome.storage.local.set({'stashServerUrl': $("#stashServerUrl").val()});
		chrome.storage.sync.set({'stashServerUrl': $("#stashServerUrl").val()}, function(){
			$("#saveMessage").show().delay(2000).fadeOut( 1000, "linear");
		});
	});
	var value;
	chrome.storage.local.get('intervalValue', function(items){
		var value = 10; //default to 10 sec
		if(typeof items.intervalValue != "undefined"){
			value = items.intervalValue;
		}
		$('#intervalValue').val(value);
	});
	chrome.storage.local.get('stashServerUrl', function(items){
		var value = ""; //default to 10 sec
		if(typeof items.stashServerUrl != "undefined"){
			value = items.stashServerUrl;
		}
		$('#stashServerUrl').val(value);
	});
	
});
