<div align="center">
  <img src="src/images/logo_text.svg" alt="torchlight" width="240" style="margin:16px 0 48px;">
</div>

A Chrome extension that displays customizable banners to visually distinguish between local, staging, and production environments.

## Features

- **Environment Detection**: Automatically detects and displays the current environment (local, staging, or production) based on the domain
- **Customizable Banners**: Configure text, colors, font size, position, opacity, and blur effects for each environment
- **Project Management**: Manage multiple projects with different domain mappings
- **Environment Switching**: Quickly switch between environments with keyboard shortcuts or popup buttons
- **URL Conversion**: Automatically convert URLs when switching between environments
- **Settings Export/Import**: Backup and restore your configuration
- **Internationalization**: Supports multiple languages (English, Japanese)

## Setup

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

In development mode, the extension is built to the `dist` directory. Load the `dist` directory from Chrome's extension management page.

### Production Build

```bash
npm run build
```

This generates an optimized extension in the `dist` directory.

### Create Distribution Package

```bash
npm run package
```

This command creates a `torchlight-extension.zip` file containing the contents of the `dist` directory. The source code (`src` directory) is not included in the zip file.

**Distribution Steps:**
1. Run `npm run package` to create the zip file
2. Distribute `torchlight-extension.zip` along with `INSTALL.md`
3. Recipients should follow the instructions in `INSTALL.md` to install

**Update Notes:**
- When distributing updates, update the `version` field in `src/manifest.json` (e.g., `1.0.0` → `1.1.0`)
- Recipients can update the extension by following the "Extension Update Method" section in `INSTALL.md`
- User settings (project information and color settings) are preserved as long as the extension is updated without being removed

## Usage

1. Install the extension following the instructions in `INSTALL.md`
2. Click the extension icon to open the popup
3. Configure your projects and environment settings in the options page (right-click the extension icon → Options)
4. Set up domain mappings for each project to enable automatic environment detection
5. Customize banner appearance (text, colors, position, opacity, etc.) for each environment
6. Use keyboard shortcuts or popup buttons to quickly switch between environments