import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { layoutFiles, type LayoutName } from './layouts.js';
import type { CanonicalDocument } from './types/canonical-article.js';
import { renderWithAssets, type RendererAssets } from './renderer.core.js';

function getPaths() {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const projectRoot = path.resolve(currentDir, '..');

  return {
    layoutsDir: path.join(projectRoot, 'src', 'templates', 'layouts'),
    partialsDir: path.join(projectRoot, 'src', 'templates', 'partials'),
    compiledStylesPath: path.join(projectRoot, 'src', 'styles', 'compiled.css')
  };
}

function readPartialsRecursively(dir: string, root: string, partials: Record<string, string>): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readPartialsRecursively(fullPath, root, partials);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.hbs')) {
      continue;
    }

    const partialName = path
      .relative(root, fullPath)
      .replace(/\\/g, '/')
      .replace(/\.hbs$/, '');
    partials[partialName] = fs.readFileSync(fullPath, 'utf8');
  }
}

function loadAssetsFromDisk(): RendererAssets {
  const { layoutsDir, partialsDir, compiledStylesPath } = getPaths();

  if (!fs.existsSync(compiledStylesPath)) {
    throw new Error('compiled.css not found — run npm run build:css first');
  }

  const layouts = Object.fromEntries(
    Object.entries(layoutFiles).map(([layout, fileName]) => {
      const fullPath = path.join(layoutsDir, fileName);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Layout template missing for \"${layout}\": ${fullPath}`);
      }
      return [layout, fs.readFileSync(fullPath, 'utf8')];
    })
  ) as Record<LayoutName, string>;

  const partials: Record<string, string> = {};
  readPartialsRecursively(partialsDir, partialsDir, partials);

  return {
    layouts,
    partials,
    styles: fs.readFileSync(compiledStylesPath, 'utf8')
  };
}

let cachedAssets: RendererAssets | null = null;

function getAssets(): RendererAssets {
  if (!cachedAssets) {
    cachedAssets = loadAssetsFromDisk();
  }
  return cachedAssets;
}

export function render(document: CanonicalDocument): string {
  return renderWithAssets(document, getAssets());
}

function liveProgramPageDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const colocated = path.join(currentDir, 'live-program-page');
  if (fs.existsSync(colocated)) return colocated;

  // Source-level verification runs after Vite has emitted the package bundle.
  // Published code resolves the colocated dist directory above.
  return path.join(path.resolve(currentDir, '..'), 'dist', 'live-program-page');
}

export function liveProgramPageHtml(): string {
  const pageDir = liveProgramPageDir();
  const htmlPath = path.join(pageDir, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(
      `live-program-page/index.html not found at ${htmlPath} — run npm run build:live-program first`
    );
  }

  return fs.readFileSync(htmlPath, 'utf-8');
}

function fontsDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  return path.join(currentDir, 'fonts');
}

export type FontFileEntry = {
  key: string;
  body: Buffer;
  contentType: string;
};

export function fontFiles(): FontFileEntry[] {
  const dir = fontsDir();
  if (!fs.existsSync(dir)) {
    throw new Error(
      `fonts directory not found at ${dir} — run npm run build first`
    );
  }

  const entries: FontFileEntry[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (!item.isFile()) continue;
    const fullPath = path.join(dir, item.name);
    entries.push({
      key: `content/fonts/${item.name}`,
      body: fs.readFileSync(fullPath),
      contentType: contentTypeForFile(item.name),
    });
  }

  // Also include fonts.css
  const cssPath = path.join(dir, 'fonts.css');
  if (fs.existsSync(cssPath)) {
    entries.push({
      key: 'content/fonts/fonts.css',
      body: fs.readFileSync(cssPath),
      contentType: 'text/css',
    });
  }

  return entries;
}

export function liveProgramPageAsset(filename: string): string {
  const pageDir = liveProgramPageDir();
  const assetPath = path.join(pageDir, filename);

  if (!fs.existsSync(assetPath)) {
    throw new Error(
      `live-program-page/${filename} not found at ${assetPath} — run npm run build:live-program first`
    );
  }

  return fs.readFileSync(assetPath, 'utf-8');
}

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function contentTypeForFile(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
}

export type LiveProgramFileEntry = {
  key: string;
  body: Buffer;
  contentType: string;
};

export function liveProgramPageFiles(): LiveProgramFileEntry[] {
  const pageDir = liveProgramPageDir();
  if (!fs.existsSync(pageDir)) {
    throw new Error(
      `live-program-page directory not found at ${pageDir} — run npm run build:live-program first`
    );
  }

  const entries: LiveProgramFileEntry[] = [];

  function walk(dir: string, prefix: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativeKey = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory()) {
        walk(fullPath, relativeKey);
      } else if (item.isFile()) {
        entries.push({
          key: relativeKey,
          body: fs.readFileSync(fullPath),
          contentType: contentTypeForFile(item.name),
        });
      }
    }
  }

  walk(pageDir, '');
  return entries;
}
