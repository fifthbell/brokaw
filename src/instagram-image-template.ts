import Handlebars from 'handlebars';
import qrcode from 'qrcode-generator';

export type InstagramImageTemplateParams = {
  imageUrl: string;
  title: string;
  category?: string;
  slug?: string;
  url?: string;
};

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && typeof process.versions?.node === 'string';
}

async function loadTemplateSource(): Promise<string> {
  if (isNodeRuntime()) {
    const [{ readFileSync }, pathModule, { fileURLToPath }] = await Promise.all([
      import('node:fs'),
      import('node:path'),
      import('node:url'),
    ]);

    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = pathModule.dirname(currentFile);
    const projectRoot = pathModule.resolve(currentDir, '..');
    const filePath = pathModule.join(
      projectRoot,
      'src',
      'templates',
      'templates',
      'instagram-image.hbs',
    );

    return readFileSync(filePath, 'utf8');
  }

  const module = await import('./templates/templates/instagram-image.hbs?raw');
  return module.default as string;
}

const template = Handlebars.compile(await loadTemplateSource());

function buildQrCodeHtml(url: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const qrSvg = qr.createSvgTag(5, 0);
  return `<div class="qr-container"><div class="qr-code" aria-label="QR Code">${qrSvg}</div></div>`;
}

function buildLogoSvg(): string {
  return `<div style="color: white; width: 140px; height: 119px; display: flex; align-items: center; justify-content: end;">
      <svg width="61" height="61" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
        <path d="M4 2C2.8 3.7 2 5.7 2 8"></path>
        <path d="M22 8a10 10 0 0 0-2-6"></path>
      </svg>
    </div>`;
}

function resolveCategoryName(params: InstagramImageTemplateParams): string {
  if (params.category) {
    return params.category.toUpperCase();
  }
  if (params.slug) {
    return params.slug.replace(/-/g, ' ').toUpperCase();
  }
  return 'LATEST STORY';
}

export function buildInstagramImageHtml(params: InstagramImageTemplateParams): string {
  const qrCodeHtml = params.url ? buildQrCodeHtml(params.url) : '';

  return template({
    imageUrl: params.imageUrl,
    title: params.title,
    categoryName: resolveCategoryName(params),
    qrCodeHtml,
    logoSvg: buildLogoSvg(),
  }).trim();
}
