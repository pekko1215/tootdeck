$(function() {
        setInterval(function() {
                var bases = $('fieldset[class="accordion-divider-t button-tray padding-hs"]');
                var b = $('<button id="tootdeck" type="button" class="btn btn-alt btn-neutral btn-options-tray padding-hn padding-rs">')
                b.click(function(event) {
                        var b = $(this)
                        console.log(b)
                        var p = b.parents('[class="column-panel flex flex-column height-p--100"]')
                        var i = p.find('[class="js-submittable-input js-column-title-edit-box column-title-edit-box "]').eq(0)
                        var baseURL = i.attr('value');
                        var tstream = "public"
                        if (baseURL.split(':').length != 1) {
                                tstream = baseURL.split(':')[1];
                                baseURL = baseURL.split(':')[0];
                        }
                        if (baseURL.slice(-1) != '/') {
                                baseURL += '/'
                        }
                        column = i.attr('value');
                        if (baseURL.indexOf('https://') == -1) {
                                baseURL = 'https://' + baseURL
                        }
                        chrome.storage.local.get('keys', function(value) {
                                if (!('keys' in value) || !value.keys) {
                                        value.keys = {};
                                }
                                console.log(value.keys);
                                if (!(baseURL in value.keys) || !('access_token' in value.keys[baseURL])) { //まだ認証完了していない場合
                                        if (!('tmpurl' in value.keys)) {
                                                value.keys.tmpurl = "";
                                        }
                                        console.log(value.keys)
                                        if (value.keys.tmpurl == baseURL) { //すでに認証開始し、途中で中断した場合
                                                var client_id = value.keys[baseURL].client_id;
                                                var client_secret = value.keys[baseURL].client_secret;
                                                var redirect_uri = value.keys[baseURL].redirect_uri;

                                                var authData = {
                                                        'client_id': client_id,
                                                        'response_type': 'code',
                                                        'redirect_uri': redirect_uri,
                                                        'scope': 'read write follow'
                                                }
                                                var authURL = baseURL + 'oauth/authorize';
                                                window.open(authURL + '?' + $.param(authData))
                                        } else { //まだなーんにもしてない場合
                                                value.keys.tmpurl = baseURL;
                                                value.keys[baseURL] = {};
                                                value.keys[baseURL].columns = [{ 'stream': tstream, 'column': column }];
                                                chrome.storage.local.set({ 'keys': value.keys }, function() {
                                                        redirect_uris = chrome.extension.getURL('callback.html');
                                                        var ClientData = {
                                                                'client_name': 'TootDeck',
                                                                'redirect_uris': redirect_uris, //'urn:ietf:wg:oauth:2.0:oob',
                                                                'scopes': 'read write follow'
                                                        }
                                                        clientURL = baseURL + 'api/v1/apps'
                                                        $.post(clientURL, ClientData, function(res) {
                                                                var client_id = res.client_id;
                                                                var client_secret = res.client_secret;
                                                                var redirect_uri = res.redirect_uri;

                                                                value.keys[baseURL].client_id = client_id;
                                                                value.keys[baseURL].client_secret = client_secret;
                                                                value.keys[baseURL].redirect_uri = redirect_uri;

                                                                var authData = {
                                                                        'client_id': client_id,
                                                                        'client_secret': client_secret,
                                                                        'response_type': 'code',
                                                                        'redirect_uri': redirect_uri,
                                                                        'scope': 'read write follow'
                                                                }
                                                                var authURL = baseURL + 'oauth/authorize';
                                                                window.open(authURL + '?' + $.param(authData))
                                                                chrome.storage.local.set({ 'keys': value.keys })
                                                        })
                                                })
                                        }
                                } else {
                                        value.keys[baseURL].columns.push({ 'stream': tstream, 'column': column })
                                        chrome.storage.local.set({ 'keys': value.keys })
                                }
                                if (!(baseURL in value.keys) && !('tmpurl' in value.keys)) {
                                        value.keys.tmpurl = baseURL;
                                        chrome.storage.local.set({ 'keys': value.keys }, function() {
                                                redirect_uris = chrome.extension.getURL('callback.html');
                                                var ClientData = {
                                                        'client_name': 'TootDeck',
                                                        'redirect_uris': redirect_uris, //'urn:ietf:wg:oauth:2.0:oob',
                                                        'scopes': 'read write follow'
                                                }
                                                clientURL = baseURL + 'api/v1/apps'
                                                $.post(clientURL, ClientData, function(res) {})

                                        })
                                }
                        })
                });
                b.append('<img width="16" height="16" src="' + chrome.extension.getURL("ele.png") + '"">')
                b.append('<span class="label">Mastodon</span>')
                for (var i = 0; i < bases.length; i++) {
                        base = bases.eq(i);
                        var sc = base.parents('[class="js-column-holder column-holder"]').find('i[class="pull-left margin-hs column-type-icon icon icon-search"]');
                        if (base.find('#tootdeck').length == 0 && sc.length != 0) {
                                base.append(b)
                        }
                }
        }, 800)

        loadltimer = setInterval(function() {
                if ($('section').length != 0) {
                        clearInterval(loadltimer)
                } else {
                        return;
                }
                chrome.storage.local.get('keys', function(value) {
                        for (instance in value.keys) {
                                if (instance == "tmpurl") {
                                        continue;
                                }
                                ckey = value.keys[instance]
                                for (i in ckey.columns) {
			       var ret = addStramListener(instance, ckey.access_token, ckey.columns[i].stream, ckey.columns[i].column)
			       console.log(ret)
			       if(ret===false){
				ckey.columns.splice(i,1)
			       }
                                }
                        }
                        chrome.storage.local.set({'keys':value.keys},console.log)
                })
        }, 100)
})

function addStramListener(instance, access_token, tstream, column) {
        var streampath = "public"
        var local_mode = false;
        console.log(tstream)
        switch (tstream) {
                case 'local':
                        local_mode = instance;
                        break;
                case 'user':
                        streampath = 'user'
                        break;
        }
        var wss = instance.replace("https", "wss").replace("http", "ws") + "api/v1/streaming" + "?access_token=" + access_token + "&stream=" + streampath
        var line = getLine(column);
        console.log(line)
        if(line===false){
	return false;
        }
        line.empty()
        console.log(wss)
        var socket = new WebSocket(wss)
        socket.targetdom = line;
        socket.local_mode = local_mode;
        socket.onmessage = function(event) {
                var data = JSON.parse(event.data);
                var payst = data.payload;
                var payload = JSON.parse(payst);
                if (typeof payload === typeof 0) {
                        return;
                }
                if (local_mode) {
                        if (payload.uri.indexOf(local_mode.replace('https://', '').replace("/", '')) == -1) {
                                return;
                        }
                }
                var tootObj = {
                                'userlink': payload.account.url,
                                'usericon': payload.account.avatar,
                                'userid': payload.account.username,
                                'username': payload.account.display_name,
                                'posttime': payload.created_at,
                                'toot': payload.content
                        }
                        // console.log(tootObj)
                if(tootObj.usericon == "missing.png"){
		tootObj.usericon = "";
                }
                if (this.targetdom.children().length > 200) {
                        this.targetdom.children().last().remove();
                }
                this.targetdom.prepend(parseContentsData(tootObj))
        };
        socket.onopen = console.log;
        socket.onclose = console.log;
        socket.onerror = console.log;
}

function getLine(column) {
        var bases = $('input[class="js-submittable-input js-column-title-edit-box column-title-edit-box "][value="' + column + '"]');
        var base = null;
        for (var i = 0; i < bases.length; i++) {
                base = bases.eq(i)
                console.log(base)
                if (!base.prop("disabled")) {
                        base.prop("disabled", true);
                        base.css('background-color', "#9C9C9C")
                        break;
                }else{
		base = null;
                }
        }
        if(base == null){
	return false;
        }
        var section = base.parents('section').eq(0)
        var line = section.find('[class="js-column-scroller js-dropdown-container column-scroller position-rel scroll-v flex-auto height-p--100 scroll-styled-v "]')
        return line;
}

function parseContentsData(data) {
        var baseHTML = '\
<article class="stream-item js-stream-item  is-draggable  is-actionable" style="">\
    <div class="js-stream-item-content item-box js-show-detail ">\
        <div class="js-tweet tweet         is-favorite">\
            <header class="tweet-header js-tweet-header flex flex-row flex-align--baseline">\
                <a class="account-link link-complex block flex-auto" href="$userlink" rel="user" target="_blank">\
                    <div class="obj-left item-img tweet-img position-rel"> <img class="tweet-avatar avatar  pin-top" src="$usericon" width="48" height="48" alt="$userid\'s avatar"> </div>\
                    <div class="nbfc "> <span class="account-inline txt-ellipsis"> <b class="fullname link-complex-target">$username</b>   <span class="username txt-mute">@$userid</span> </span>\
                    </div>\
                </a>\
                <time class="tweet-timestamp js-timestamp txt-mute flex-shrink--0" datetime="$posttime"> <a class="txt-small no-wrap" href="$poststatus" rel="url" target="_blank">12m</a> </time>\
            </header>\
            <div class="tweet-body js-tweet-body">\
                <p class="js-tweet-text tweet-text with-linebreaks " lang="ja">$toot\
                </p>\
                <div class="js-card-container margin-tm is-hidden"></div>\
            </div>\
            <footer class="tweet-footer cf">\
            </footer>\
        </div>\
    </div>\
</article>'
                /*
                $userlink
                $usericon
                $userid
                $username
                $posttime
                $poststatus
                 */
        return baseHTML.replace(/\$userlink/g, data.userlink)
                .replace(/\$usericon/g, data.usericon)
                .replace(/\$userid/g, data.userid)
                .replace(/\$username/g, data.username)
                .replace(/\$posttime/g, data.posttime)
                .replace(/\$poststaus/g, data.poststaus)
                .replace(/\$toot/g, data.toot)
}
// new (require("ws"))("wss://pawoo.net/api/v1/streaming/?access_token=bd6b1598912e4bd9c048010dbb782882467f8ed2b0f84100223f5728e555cd0c&stream=public").on("message",console.log)'
