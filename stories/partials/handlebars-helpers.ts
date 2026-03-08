import Handlebars from 'handlebars';

let initialized = false;

export function registerCommonHelpers(): void {
  if (initialized) return;

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  Handlebars.registerHelper('slice', (items: unknown, start: number, end?: number) => {
    if (!Array.isArray(items)) return [];
    return items.slice(start, end);
  });

  Handlebars.registerHelper('uppercase', (value: unknown) => String(value ?? '').toUpperCase());

  Handlebars.registerHelper('formatDate', (isoString: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
    } catch {
      return isoString;
    }
  });
  Handlebars.registerHelper('xStatusUrl', (url: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'x.com' || parsed.hostname === 'www.x.com') {
        return `https://twitter.com${parsed.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  });
  Handlebars.registerHelper('xEmbedUrl', (url: string) => {
    if (!url) return '';

    const buildEmbedUrl = (tweetId: string) => `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`;
    const idFromRaw = url.match(/status\/(\d+)/)?.[1];

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host === 'x.com' || host === 'twitter.com') {
        const tweetId = parsed.pathname.match(/\/[^/]+\/status\/(\d+)/)?.[1];
        if (tweetId) return buildEmbedUrl(tweetId);
      }
      return idFromRaw ? buildEmbedUrl(idFromRaw) : '';
    } catch {
      return idFromRaw ? buildEmbedUrl(idFromRaw) : '';
    }
  });
  Handlebars.registerHelper('xTweetId', (url: string) => {
    if (!url) return '';
    const idFromRaw = url.match(/status\/(\d+)/)?.[1];
    if (idFromRaw) return idFromRaw;

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host === 'x.com' || host === 'twitter.com') {
        return parsed.pathname.match(/\/[^/]+\/status\/(\d+)/)?.[1] ?? '';
      }
      return '';
    } catch {
      return '';
    }
  });
  Handlebars.registerHelper('instagramEmbedUrl', (url: string) => {
    if (!url) return '';
    const normalized = url.endsWith('/') ? url : `${url}/`;
    return `${normalized}embed/`;
  });
  Handlebars.registerHelper('tiktokEmbedUrl', (url: string) => {
    if (!url) return '';
    const match = url.match(/\/video\/(\d+)/);
    if (!match) return url;
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  });

  initialized = true;
}
