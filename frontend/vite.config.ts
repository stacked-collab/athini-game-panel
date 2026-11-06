import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function readVersionsFromPackageJson(): { appVersion: string; imageVersion: string } | null {
  try {
    const raw = fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown; gamepanelImageVersion?: unknown };
    const value = typeof parsed.version === 'string' ? parsed.version.trim() : '';
    const imageValue = typeof parsed.gamepanelImageVersion === 'string' ? parsed.gamepanelImageVersion.trim() : '';
    return value ? { appVersion: value, imageVersion: imageValue || value } : null;
  } catch {
    return null;
  }
}

const versions = readVersionsFromPackageJson() ?? { appVersion: '0.0.0-dev', imageVersion: '0.0.0-dev' };
const { appVersion, imageVersion } = versions;

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __IMAGE_VERSION__: JSON.stringify(imageVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@codemirror') || id.includes('@uiw') || id.includes('@lezer')) {
            return 'codemirror';
          }
          if (id.includes('@xterm')) return 'xterm';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) {
            return 'charts';
          }
          if (id.includes('@ovhcloud')) return 'ods';
          if (id.includes('@dnd-kit')) return 'dndkit';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
