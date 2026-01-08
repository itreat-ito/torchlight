# Environment Banner Chrome Extension

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

## プロジェクト構造

```
env-detector/
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
