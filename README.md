# Ticket App User

## 開発環境のセットアップ

### デバッグ手順

1. ローカルサーバーの起動
```bash
npm run dev
```

2. ngrokを使用してローカルサーバーを公開
```bash
ngrok http 3000
```

3. LINE Developers設定の更新
- ngrokで取得したURLを以下の2箇所に設定してください：
  - [LIFF URL](https://developers.line.biz/console/channel/2007075154/liff/2007075154-MeVpnkjl)
  - [LINE Login コールバックURL](https://developers.line.biz/console/channel/2007075154/line-login)

※ 注意: デバッグ時は必ず上記の設定を更新してください。設定を忘れるとLINE関連の機能が正常に動作しません。
