# Firebase セットアップガイド

このガイドに従って、スケジュール管理アプリをFirebaseで公開し、みんなで共有できるようにします。

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス（Googleアカウントでログイン）
2. **「プロジェクトを追加」** をクリック
3. プロジェクト名を入力（例: `undoukai-2026`）
4. Google Analytics は「無効」でOK → **「プロジェクトを作成」**

## 2. Realtime Database の有効化

1. 左メニューの **「構築」→「Realtime Database」** をクリック
2. **「データベースを作成」** をクリック
3. ロケーション: **`asia-southeast1`**（シンガポール）を選択
4. セキュリティルール: **「テストモードで開始」** を選択 → **「有効にする」**

## 3. ウェブアプリの追加

1. プロジェクトの設定ページ（⚙️アイコン）を開く
2. **「アプリを追加」→ ウェブ（`</>`アイコン）** をクリック
3. アプリのニックネーム: `schedule-app`
4. **「Firebase Hosting も設定する」にチェック** → **「アプリを登録」**
5. 表示される `firebaseConfig` の値をコピー

## 4. 設定値の反映

`firebase-config.js` を開いて、以下の値を自分のプロジェクトの値に置き換えます:

```javascript
const firebaseConfig = {
  apiKey: "ここに自分のapiKeyを貼り付け",
  authDomain: "undoukai-2026.firebaseapp.com",
  databaseURL: "https://undoukai-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "undoukai-2026",
  storageBucket: "undoukai-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 5. Firebase Hosting へのデプロイ

### Firebase CLI のインストール
```bash
npm install -g firebase-tools
```

### ログイン
```bash
firebase login
```

### プロジェクトの初期化
```bash
cd schedule-app
firebase init hosting
```
- 既存のプロジェクトを選択（undoukai-2026）
- パブリックディレクトリ: `.`（カレントディレクトリ）
- シングルページアプリ: `No`

### デプロイ
```bash
firebase deploy --only hosting
```

### 完了！
デプロイ後に表示されるURLをみんなに共有すれば、同じスケジュールをリアルタイムで管理できます！

例: `https://undoukai-2026.web.app`

## トラブルシューティング

- **「ローカルモード」と表示される**: `firebase-config.js` の設定値が正しく入力されているか確認
- **データが保存されない**: Realtime Database のルールが「テストモード」になっているか確認
- **テストモードの期限切れ**: Firebase Console でルールを更新（期限を延長）
