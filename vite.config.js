import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'css') {
        return `chrome-extension://__MSG_@@extension_id__/${filename}`;
      }
    },
  },
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
  }
});
