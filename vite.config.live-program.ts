import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(__dirname, 'dist', 'live-program-page');
const packageVersion = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version as string;
const bundleName = `live-program.v${packageVersion}`;

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

function listFiles(dir: string, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(join(dir, entry.name), key) : [key];
  }).sort((left, right) => left.localeCompare(right));
}

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

        const cssPath = join(outDir, `${bundleName}.css`);
        const localFontPrefix = './fifthbell/fonts/';
        writeFileSync(
          cssPath,
          readFileSync(cssPath, 'utf8').replaceAll('https://cdn.fifthbell.com/content/fonts/', localFontPrefix),
        );

        const fontSourceDir = resolve(__dirname, 'src/styles/fonts');
        const fontOutputDir = join(outDir, 'fifthbell/fonts');
        mkdirSync(fontOutputDir, { recursive: true });
        for (const name of readdirSync(fontSourceDir)) {
          if (name.endsWith('.ttf')) copyFileSync(join(fontSourceDir, name), join(fontOutputDir, name));
        }

        const files = listFiles(outDir)
          .filter((key) => key !== 'live-program-manifest.json')
          .map((key) => {
            const body = readFileSync(join(outDir, key));
            const extension = key.slice(key.lastIndexOf('.'));
            return {
              key,
              contentType: contentTypes[extension] ?? 'application/octet-stream',
              bytes: body.byteLength,
              sha256: createHash('sha256').update(body).digest('hex'),
            };
          });
        writeFileSync(join(outDir, 'live-program-manifest.json'), `${JSON.stringify({
          package: '@fifthbell/brokaw',
          bundleVersion: packageVersion,
          schemaVersion: 1,
          entrypoint: 'index.html',
          statePath: 'state',
          eventsPath: 'events',
          files,
        }, null, 2)}\n`);
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
        entryFileNames: `${bundleName}.js`,
        assetFileNames: `${bundleName}[extname]`,
      },
    },
  },
});
