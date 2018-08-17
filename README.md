# tootdeck
![使用例](https://raw.githubusercontent.com/Arika0093/tootdeck/master/others/mov.gif)
- mastodonのTLをtweetdeckに表示させるchrome拡張
- pekko1215([@eakonnsamui](https://twitter.com/eakonnsamui))さん作

### 導入
- [Releaseページ](https://github.com/Arika0093/tootdeck/releases)へ移動
- ***Source code (zip)*** と書いてあるリンクをクリック、保存→解凍
- [Chrome拡張機能ページ](chrome://extensions/)を開き、デベロッパーモードをONにする
- 中に入っていた`source`フォルダをchromeにドラッグ＆ドロップ
- これで導入は完了。

### 使い方
- tweetdeckを開きます。
- 検索で「インスタンスURL:XXX」を検索。
	- XXXには表示させるTLの種類を指定。
	- `user`: ホームTL, `public`: 連合, `local`: ローカル。
	- 例えば、pawoo.netのホームTLを出したければ、`pawoo.net:user`と検索。
- 検索カラム右上の設定ボタンを押すと、mastodonのボタンが表示されるのでそれをクリック。
- 認証します。
- Tweetdeckを再読み込み(F5)させます。
- 以上！

### 機能
- TLがtweetdeckで見れます。
- post機能が追加されました(v1.01a)
- TLの画像を閲覧する機能が追加されました(v1.01a)

![使用例](https://raw.githubusercontent.com/Arika0093/tootdeck/master/others/image2.png)

### 課題
- 作成者が複垢持ってないのでちゃんと動作するかは不明。
- boost/fav/rplyとかはまだ未実装。必要になったら実装。

