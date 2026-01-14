# torchlight

環境（ローカル、ステージング、本番）を視覚的に区別するためのChrome拡張機能です。

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 開発モード

```bash
npm run dev
```

開発モードでは、`dist`ディレクトリにビルドされた拡張機能が生成されます。Chromeの拡張機能管理画面から、`dist`ディレクトリを読み込んでください。

### 本番ビルド

```bash
npm run build
```

`dist`ディレクトリに最適化された拡張機能が生成されます。

### 配布用パッケージの作成

```bash
npm run package
```

このコマンドを実行すると、`dist`ディレクトリの内容を`torchlight-extension.zip`として圧縮します。
このzipファイルにはソースコード（`src`ディレクトリ）は含まれません。

**配布手順：**
1. `npm run package`を実行してzipファイルを作成
2. `torchlight-extension.zip`と`INSTALL.md`を一緒に配布
3. 受け取った人は`INSTALL.md`の手順に従ってインストール

**更新時の注意：**
- 更新を配布する場合は、`src/manifest.json`の`version`フィールドを更新してください（例: `1.0.0` → `1.0.1`）
- 受け取った人は`INSTALL.md`の「拡張機能の更新方法」に従って更新できます
- 拡張機能を削除せずに更新する限り、ユーザーの設定（プロジェクト情報やカラー設定）は保持されます

## プロジェクト構造

```
torchlight/
├── src/                    # ソースコード
│   ├── content/           # コンテンツスクリプト
│   │   ├── content.js
│   │   └── styles.css
│   ├── popup/             # ポップアップ
│   │   ├── popup.js
│   │   └── popup.html
│   ├── options/           # オプションページ
│   │   ├── options.js
│   │   ├── options.html
│   │   └── options.css
│   └── manifest.json      # 拡張機能マニフェスト
├── dist/                  # ビルド出力（gitignore）
├── vite.config.js         # Vite設定
└── package.json
```

## 技術スタック

- **Vite**: ビルドツール
- **@crxjs/vite-plugin**: Chrome拡張機能用Viteプラグイン

## 開発

- ソースコードは`src`ディレクトリに配置されています
- Viteが自動的にJSとCSSをバンドルします
- 開発モードでは、ファイル変更時に自動的にリロードされます
