var code = location.search.match(/code=(.*?)(&|$)/)[1];
console.log(document.referrer)
chrome.storage.local.get('keys',function(value){
	value.keys[value.keys.tmpurl]['code'] = code;
	var lkeys = value.keys[value.keys.tmpurl];
	$.post(value.keys.tmpurl+'oauth/token',{
		'grant_type':'authorization_code',
		'redirect_uri':lkeys.redirect_uri,
		'client_id':lkeys.client_id,
		'client_secret':lkeys.client_secret,
		'code':code
	},function(res){
		console.log(res)
		value.keys[value.keys.tmpurl]['access_token'] = res.access_token;
		value.keys.tmpurl = "";
		chrome.storage.local.set({'keys':value.keys},function(){
			window.close()
		})
	})
})