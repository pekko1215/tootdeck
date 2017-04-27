params = {
        'client_id': '5a14f0da462bfe949555f50262ecd750d1af80153fae8aab087b9e82037754e1',
        'response_type' : 'code',
        'redirect_url': 'urn:ietf:wg:oauth:2.0:oob',
        'scope': 'read write follow'
}

console.log('https://pawoo.net/oauth/authorize?'+encodeParams(params))

function encodeParams(obj){
	var t = "";
	Object.keys(obj).forEach(function(i){
		t += "&"+encodeURIComponent(i)+"="+encodeURIComponent(obj[i]);
	})
	return t;
}