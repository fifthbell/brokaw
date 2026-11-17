import { CapturedCatalogError, type CapturedResourceKind } from './captured-catalog.js';
import {
  CapturedReaderError,
  createCapturedCatalogReader,
  type CapturedCatalogReader,
  type CapturedFetch,
} from './captured-catalog-reader.js';

/** The element `shell/captured-catalog` renders the CMS-issued selection into. */
export const CAPTURED_SELECTION_ELEMENT_ID = 'brokaw-captured-selection';

interface ElementLike {
  readonly textContent: string | null;
  getAttribute(name: string): string | null;
}

/** The parts of a browser window the installer reads. */
export interface CapturedCatalogHost {
  readonly document: {
    readonly documentElement: { readonly lang: string };
    getElementById(id: string): ElementLike | null;
    querySelector(selector: string): ElementLike | null;
  };
  fetch: CapturedFetch;
  brokawCapturedCatalog?: CapturedCatalogReader;
}

function failingReader(error: unknown): CapturedCatalogReader {
  return Object.freeze({
    read: (_kind: CapturedResourceKind, _key: string) => Promise.reject(error),
  });
}

function canonicalOrigin(host: CapturedCatalogHost): string {
  const href = host.document.querySelector("link[rel='canonical']")?.getAttribute('href');
  try {
    return new URL(String(href)).origin;
  } catch {
    throw new CapturedReaderError('page_mismatch');
  }
}

/**
 * Installs `brokawCapturedCatalog` for the page's readers. A selection that
 * cannot be read installs a reader whose every read rejects, so the readers
 * show their unavailable state and never fall back to their current sources.
 */
export function installCapturedCatalog(host: CapturedCatalogHost): void {
  let reader: CapturedCatalogReader;
  try {
    const element = host.document.getElementById(CAPTURED_SELECTION_ELEMENT_ID);
    let selection: unknown;
    try {
      selection = JSON.parse(element?.textContent ?? '');
    } catch {
      throw new CapturedCatalogError('invalid_selection');
    }
    const page = { origin: canonicalOrigin(host), locale: host.document.documentElement.lang };
    reader = createCapturedCatalogReader(selection, page, (url, init) => host.fetch(url, init));
  } catch (error) {
    reader = failingReader(error);
  }
  host.brokawCapturedCatalog = reader;
}
