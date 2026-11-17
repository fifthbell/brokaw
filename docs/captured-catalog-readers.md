# Captured-catalog readers

Brokaw #30 connects every public runtime reader to the captured-catalog
contract in [captured-catalog.md](captured-catalog.md) (#29). It is live on
release and has no switch. Each reader uses the captured selection when the
document carries one, and otherwise reads exactly what it reads today.

## When it applies

A page document may carry an optional `capturedSelection` member. It holds the
expected selection from #29: exactly `selectionId`, `catalogUrl`, `context`
(`rendererVersion`, `templateVersion`, `tenant`, `origin`, `build`) and
`locale`. The canonical-document schema declares this member on both branches,
so Cronkite rejects a `null`, malformed or extended selection at the document
boundary.

The producer supplies the member in the completed render document. That
producer is Ariston's captured site generations, turned on through
gaulatti/ariston#198. Until a producer supplies it, no page carries a
selection, and every rendered page is byte-identical to the current sources.

## Without a selection

The captured branches are template conditionals whose `else` side is the
current reader code, unchanged. A document without `capturedSelection` renders
the same bytes as before #30. `src/captured-readers.test.ts` proves this for
every page renderable in every supported locale and for every manifest system
variant.

The current sources stay as they are:

- `content/weather-current.json`;
- `content/homepage-current-<lang>.json`;
- `content/<category>-current-<lang>.json`;
- the search manifest with its monthly and yearly files;
- `assignmentMediaBaseUrl` with `<key>.json`.

This includes Mediathek's strict behaviour.

## With a selection

`headers/header-main` renders `shell/captured-catalog` before its first
script. That partial contains:

- the selection as `application/json` in `#brokaw-captured-selection`;
- the browser adapter, which installs `window.brokawCapturedCatalog`.

Every page renderable that has a runtime reader includes the header. Each
reader then calls `read(kind, key)` and never builds a current-source URL.

| Reader | Kind | Key | Payload shape (the file it replaces) |
|---|---|---|---|
| Header weather | `weather` | `weather` | `weather-current.json` |
| Menu navigation and homepage preview | `homepage` | `homepage` | `homepage-current-<lang>.json` (its `categories` are the navigation) |
| Menu category preview | `category` | `category:<slug>` | `<slug>-current-<lang>.json` |
| Search | `search` | `search` | one complete index `{ "articles": [...] }` covering every month and year the manifest lists today |
| Mediathek gallery | `assignment` | `assignment:<route key>` | `contents/assignments/<key>.json` |

Each catalog is for one locale, so keys carry no language. The producer must
issue each key that a page can request.

Kinds that no reader requests:

- `navigation`: the navigation comes from the homepage payload, as it does today.
- `media` and `system`: system pages and server-rendered content come from the
  render document itself.

## Binding and failure

The adapter is `src/captured-catalog-reader.ts` together with
`src/captured-catalog-browser.ts`.

**Binding before any request**
- It validates the selection through the #29 contract.
- The selection's `context.origin` must equal the origin of the page's own
  canonical URL.
- Its `locale` must equal the page's `<html lang>`.
- The catalog must match the selection exactly. This covers the selection
  identity, all five context fields and the locale.

**Fetching**
- Requests go only to issued locations, with
  `{ cache: 'no-store', credentials: 'omit', redirect: 'error' }`.
- The catalog and each resource stop at 8 MiB. The limit is checked against a
  declared `Content-Length` and again while the body streams.
- Resource bytes are verified against the issued SHA-256 before they are
  parsed.

**Failure**
- Every read resolves the catalog again. A later withdrawal therefore reaches
  the next read, such as the hourly weather refresh or opening the menu. After
  an outage, the next read recovers.
- Any failure rejects the read, and that reader shows its existing unavailable
  state. This includes an invalid or stale selection, a context or locale
  mismatch, withdrawal, an unknown key or kind, an error status or network
  error, an oversize body, invalid JSON and a checksum mismatch.
- A failed read never falls back to a current source, so selected and live
  mutable JSON are never mixed on one page.
- Error text contains only a bounded code.

## Generated partial

Cronkite compiles the packaged Handlebars templates and allows only the pinned
helpers. For that reason the adapter ships as a committed, declared partial.

- `npm run generate:captured-catalog` bundles `src/captured-catalog-browser.ts`
  into `src/templates/partials/shell/captured-catalog.hbs`.
- The bundle carries only `outletConfig.supportedLanguages`, the one outlet
  field the contract reads. Generation fails if the contract starts reading
  another field.
- `scripts/generate-captured-catalog-partial.test.mjs` fails when the
  committed partial is stale.

## Evidence and rollback

- `src/captured-readers.test.ts` runs the rendered reader scripts in a minimal
  DOM. It covers captured weather, navigation, homepage and category reads, and
  the failure cases: withdrawn, stale, mixed-context and mixed-locale catalogs,
  page-locale mismatch and checksum mismatch.
- It also checks counts and final pages against large data:
  - a 2,000-article historical search index in `en`, `es` and `it`: 667
    results over 34 pages with 7 on the last, and 2,000 results over 100 full
    pages;
  - a 1,044-photo gallery: page 22 of 22 with 36 photos.
- These exceed the largest repository fixtures: a 40-article homepage, a
  28-article category and the 1,044-photo `PaginatedLargeGallery` story.
- Storybook `Pages/CapturedCatalog` runs the same scripts in a real browser
  frame against a fictional generation.

Rollback is owned by the selection producer: stop supplying
`capturedSelection` and every reader returns to its current source. A defect
in a reader is fixed forward. Package version and publication belong to #31.
