import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(__dirname, 'dist', 'live-program-page');

export default defineConfig({
  base: './',
  publicDir: resolve(__dirname, 'src/live-program/public'),
  envDir: 'src/live-program',
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'flatten-html',
      closeBundle() {
        const nested = join(outDir, 'src', 'live-program', 'index.html');
        const flat = join(outDir, 'index.html');
        if (existsSync(nested)) {
          let html = readFileSync(nested, 'utf-8');
          html = html.replace(/src="\.\.\/\.\.\//g, 'src="./');
          html = html.replace(/href="\.\.\/\.\.\//g, 'href="./');
          writeFileSync(flat, html);
          rmSync(join(outDir, 'src'), { recursive: true, force: true });
        }
      },
    },
  ],
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/live-program/index.html'),
      output: {
        entryFileNames: 'live-program.js',
        assetFileNames: 'live-program[extname]',
      },
    },
  },
});
