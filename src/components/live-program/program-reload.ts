/** The parts of the browser window a program reload uses. */
export interface ReloadWindow {
  location: Pick<Location, 'href' | 'replace'>;
  caches?: Pick<CacheStorage, 'keys' | 'delete'>;
}

/**
 * Answers a program_reload event: clears every Cache Storage entry when the
 * browser has Cache Storage, then reloads the page with a cache-busting query.
 * A failed cache clear is reported and the page still reloads.
 */
export function clearCachesAndReload(win: ReloadWindow): void {
  const reloadWithCacheBust = () => {
    const nextUrl = new URL(win.location.href);
    nextUrl.searchParams.set('_reload', Date.now().toString());
    win.location.replace(nextUrl.toString());
  };
  const caches = win.caches;
  if (!caches) {
    reloadWithCacheBust();
    return;
  }
  void caches.keys()
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .catch((err) => { console.warn('[program_reload] cache clear failed:', err); })
    .finally(() => { reloadWithCacheBust(); });
}
