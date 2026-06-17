import Handlebars from 'handlebars';
import qrcode from 'qrcode-generator';

export type InstagramImageTemplateParams = {
  imageUrl: string;
  title: string;
  category?: string;
  slug?: string;
  url?: string;
};

function buildQrCodeHtml(url: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const qrSvg = qr.createSvgTag(5, 0);
  return `<div class="qr-container"><div class="qr-code" aria-label="QR Code">${qrSvg}</div></div>`;
}

export function registerInstagramImageHelpers(): void {
  Handlebars.registerHelper('instagramQrCode', (url: string) => buildQrCodeHtml(url));
}

registerInstagramImageHelpers();

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
  }).trim();
}
