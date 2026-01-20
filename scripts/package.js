import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// manifest.jsonからバージョンを読み取る
const manifestPath = join(rootDir, 'src', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const version = manifest.version;

// distディレクトリに移動してzipファイルを作成
const distDir = join(rootDir, 'dist');
const zipFileName = `torchlight-extension-${version}.zip`;
const zipPath = join(rootDir, zipFileName);

process.chdir(distDir);
execSync(`zip -r ${zipPath} .`);

console.log(`Distribution zip file created: ${zipFileName}`);
