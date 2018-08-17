const DOM = {
	// 検索フィールドの設定項目のdiv
	bases: 'fieldset.button-tray',
	// mstdn認証開始のボタン
	mstdn_button: '<button id="tootdeck" type="button" class="btn btn-alt btn-neutral btn-options-tray padding-hn padding-rs">',
	// 検索カラム自体
	mbtn_parent: '.column-panel.flex.flex-column.height-p--100',
	// 検索カラムの検索ボックス
	mbtn_searchbox: '.js-submittable-input.js-column-title-edit-box.column-title-edit-box',
	// 
	mbtn_column: '.js-column-holder.column-holder',
	// 検索設定項目のcloseとかのボタンがあるとこ
	mbtn_btns: 'i.pull-left.icon.icon-search',
	// tweetボタンがある場所
	postbtn_field: "div.compose-content.antiscroll-wrap .cf.margin-b--30 .pull-right",
	// ツイート内容を入力するbox
	textarea: "textarea.compose-text",
	// 
	postbtns: "button.js - send - button",
	//
	line_base: "input.js-submittable-input.js-column-title-edit-box",
	//
	linedom: '.js-column-scroller.js-dropdown-container',
};

$(function() {
	setInterval(function() {
		var bases = $(DOM.bases);
		var b = $(DOM.mstdn_button)
		b.click(function(event) {
			var b = $(this)
			var p = b.parents(DOM.mbtn_parent)
			var i = p.find(DOM.mbtn_searchbox).eq(0)
			var baseURL = i.attr('value');
			var tstream = "local"
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
			var sc = base.parents(DOM.mbtn_column).find(DOM.mbtn_btns);
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
		setTimeout(function(e) {
			chrome.storage.local.get('keys', function(value) {
				var key_arrays = Object.keys(value.keys);
				if (key_arrays.some((e) => e !== "tmpurl")){
					addTootButton(value.keys);
				}
				for (instance in value.keys) {
					if (instance == "tmpurl") {
						continue;
					}
					ckey = value.keys[instance]
					for (i in ckey.columns) {
						var ret = addStramListener(instance, ckey.access_token, ckey.columns[i].stream, ckey.columns[i].column)
						console.log(ret)
						if (ret === false) {
							ckey.columns.splice(i, 1)
						}
					}
				}
				chrome.storage.local.set({ 'keys': value.keys }, console.log)
			})
		}, 500);
	}, 100)
});

function postToot(instance, token, text){
	var t_enc = text; //encodeURIComponent(text);
	$.ajax({
		'url': instance + "api/v1/statuses/",
		"type": "POST",
		"data": {
			"status": t_enc,
		},
		"headers": {
			'Authorization': "Bearer " + token
		}
	}).done(function (res) {
		console.log(res);
	});

}

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
	if (line === false) {
		return false;
	}
	line.empty()
	console.log(wss)
	var socket = new WebSocket(wss)
	socket.targetdom = line;
	socket.local_mode = local_mode;
	socket.tstream = tstream;
	socket.onmessage = function(event) {
		var data = JSON.parse(event.data);
		var payst = data.payload;
		var payload = JSON.parse(payst);
		if(typeof payload === 'number'){
		return;
		}
		var instanceurl = (function(uri) {
			return uri.split(':')[1].split(',')[0];
		})(payload.uri);

		//koko
		var tootObj = converteContents(payload)

		if (this.local_mode) {
			if (instanceurl.indexOf(local_mode.replace('https://', '//')) < 0) {
				return;
			}
		}
		if (this.targetdom.children().length > 200) {
			this.targetdom.children().last().remove();
		}
		this.targetdom.prepend(parseContentsData(tootObj))
	};
	socket.onopen = function(event) {
		var thistmp = this
		var apipath = (function(param) {
			return param == "user" ? "home" : "public";
		})(this.tstream)
		$.ajax({
			'url': instance + "api/v1/timelines/" + apipath,
			"type": "GET",
			"headers": {
				'Authorization': "Bearer " + access_token
			}
		}).done(function(res) {
			for (var index = res.length-1;index>=0;index--) {
				if (apipath == "public") {
			      // console.log(thistmp.local_mode)
					if (thistmp.local_mode !== false) {
				   // console.log(thistmp.local_mode)
						var instanceurl = (function(uri) {
							return uri.split(':')[1].split(',')[0];
						})(res[index].uri);
						console.log(instanceurl)
						if (instanceurl != thistmp.local_mode.replace('https://','').replace('/','')) {
							continue;
						}
						var tootObj = converteContents(res[index])
						thistmp.targetdom.prepend(parseContentsData(tootObj))
					} else {
						var tootObj = converteContents(res[index])
						thistmp.targetdom.prepend(parseContentsData(tootObj))
					}
				} else {
					var tootObj = converteContents(res[index])
					thistmp.targetdom.prepend(parseContentsData(tootObj))
				}
			}
		})
	};
	socket.onclose = console.log;
	socket.onerror = console.log;
}

function converteContents(payload) {
	if (typeof payload === typeof 0) {
		return;
	}
	var instanceurl = (function(uri) {
		return uri.split(':')[1].split(',')[0];
	})(payload.uri);
	if (payload.account.avatar == "/avatars/original/missing.png") {
		payload.account.avatar = "https://" + instanceurl + payload.account.avatar
	}
	console.log(payload);
	var tootObj = {
			'userlink': payload.account.url,
			'usericon': payload.account.avatar,
			'userid': payload.account.username,
			'username': payload.account.display_name,
			'posturl': payload.url,
			'posttime': payload.created_at,
			'toot': payload.content,
			'medias': payload.media_attachments,
		}
		// console.log(tootObj)
	if (tootObj.usericon == "missing.png") {
		tootObj.usericon = "";
	}
	return tootObj;
}

function getLine(column) {
	var bases = $(`${DOM.line_base}[value="${column}"]`);
	var base = null;
	for (var i = 0; i < bases.length; i++) {
		base = bases.eq(i)
		if (!base.prop("disabled")) {
			base.prop("disabled", true);
			base.css('background-color', "#c8c8c8")
			base.css('color', '#165b46')
			base.on("domStyleChange", console.log)
			domStyleWatcher.Start(base, 'background-color');
			break;
		} else {
			base = null;
		}
	}
	if (base == null) {
		return false;
	}
	var section = base.parents('section').eq(0)
	var line = section.find(DOM.linedom)
	return line;
}

var domStyleWatcher = {
	Start: function (tgt, styleobj) {
		//発生
		function eventHappen(data1, data2) {
			var throwval = tgt.css(styleobj);
			tgt.trigger('domStyleChange', [throwval]); //eventを投げる
		}
		//監視の登録
		var tge = tgt[0]; //jQueryオブジェクトをelementに変えてる
		var filter = ['style']; //styleを見る
		var options = { //監視オプション
			attributes: true,
			attributeFilter: filter
		};
		var mutOb = new MutationObserver(eventHappen); //監視用インスタンス作成
		mutOb.observe(tge, options); //監視開始
		return mutOb; //一応return
	},
	Stop: function (mo) {
		mo.disconnect();
	}
};

// ----------------------------
// rendering side
function addTootButton(keys) {
	var key_arrays = Object.keys(keys);
	var instances = key_arrays.filter((e) => e != "tmpurl" && keys[e].access_token);
	instances.forEach((instance, index) => {
		var key = keys[instance] || {};
		var button_h = `<div class="js-send-button-container spinner-button-container">
		<button class="toot-button is-disabled js-send-button js-spinner-button js-show-tip Button--success btn-extra-height padding-v--6 padding-h--15"
		data-original-title="Toot${index == 0 ? " (Alt + Enter)" : ""}" data-instance="${instance}" data-token="${key.access_token}">
		Toot to ${instance.replace(/https?:/g, "").replace(/\//g, "")}</button>
		<i class="js-compose-sending-success icon-center-16 compose-send-button-success icon icon-check is-hidden"></i>
		<i class="js-spinner-button-active icon-center-16 spinner-button-icon-spinner is-hidden"></i> </div>`;
		if ($(".toot-button").length) {
			// existed
			return false;
		}
		// add button
		$(DOM.postbtn_field).append(button_h);
	});
	// action adding
	var txarea = $(DOM.textarea);
	var button = $(".toot-button");
	txarea
		.on("keydown", function (e) {
			if (e.keyCode == 13 && e.altKey) {
				var i = instances[0];
				// toot use first account
				postToot(i, keys[i].access_token, txarea.val());
				txarea.val("");
				$(DOM.postbtns).addClass("is-disabled");
				txarea.focus();
			}
		})
		.on("keyup", function () {
			var tx = txarea.val();
			button.toggleClass("is-disabled", (tx.length <= 0 || tx.length > 500));
		});
	button.on("click", function () {
		var tx = txarea.val();
		var btn = $(this);
		if (!(tx.length <= 0 || tx.length > 500)) {
			var i = btn.data("instance");
			var t = btn.data("token");
			// toot
			postToot(i, t, tx);
			// clear
			txarea.val("");
			$(DOM.postbtns).addClass("is-disabled");
			txarea.focus();
		}
	});
	return true;
}

function parseContentsData(data) {
	var baseHTML = '\
<article class="stream-item js-stream-item  is-draggable  is-actionable" style="">\
    <div class="js-stream-item-content item-box js-show-detail ">\
	<div class="js-tweet tweet is-favorite" style="margin-bottom: 1ex;">\
	    <header class="tweet-header js-tweet-header flex flex-row flex-align--baseline">\
		<a class="account-link link-complex block flex-auto url-ext" href="$userlink" data-full-url="$userlink" rel="url noopener noreferrer" target="_blank">\
		    <div class="obj-left item-img tweet-img position-rel"> <img class="tweet-avatar avatar  pin-top" src="$usericon" width="48" height="48" alt="$userid\'s avatar"> </div>\
		    <div class="nbfc "> <span class="account-inline txt-ellipsis"> <b class="fullname link-complex-target">$username</b>   <span class="username txt-mute">@$userid</span> </span>\
		    </div>\
		</a>\
	    </header>\
	    <div class="tweet-body js-tweet-body">\
		<p class="js-tweet-text tweet-text with-linebreaks " lang="ja">$toot\
		</p>\
		<div class="js-card-container margin-tm is-hidden"></div>\
		$media\
	    </div>\
	    <footer class="tweet-footer cf">\
	    </footer>\
	</div>\
    </div>\
</article>'
	var ms = data.medias;
	if (ms && ms.length > 0){
		var media_html = `
			<div class="js-media media-preview media-grid-container media-size-medium margin-vm">
			<div class="js-media media-grid-container media-size-medium margin-vm">
			<div class="media-grid-${ms.length}">
		`;
		ms.forEach((e, i) => {
			media_html += `
				<div class="media-image-container block position-rel">
					<a class="js-media-image-link pin-all media-image block "
					style="background-image:url(${e.preview_url});
					width: 120px; height: 180px; background-position: 0 0;"
					href="${e.url}" rel="mediaPreview" target="_blank"></a>
				</div>
			`;
		});
		media_html += "</div></div></div>";
	}
	return baseHTML.replace(/\$userlink/g, data.userlink)
		.replace(/\$usericon/g, data.usericon)
		.replace(/\$userid/g, data.userid)
		.replace(/\$username/g, data.username)
		.replace(/\$posttime/g, data.posttime)
		.replace(/\$poststaus/g, data.posturl)
		.replace(/\$toot/g, data.toot)
		.replace(/\$media/g, media_html || "")
}
