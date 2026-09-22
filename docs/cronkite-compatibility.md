# Cronkite compatibility

Brokaw publishes the pinned declarative template contract for Fifthbell. The
source artifact is `src/cronkite-manifest.ts`; the build validates it against
`src/schemas/cronkite-manifest.schema.json` and emits
`dist/cronkite-manifest.json`.

The emitted artifact has only three top-level members: `package`, `version`,
and `templateRendering`. Cronkite compiles the declared Handlebars entries and
partial graph directly. Publishing an HTML page no longer requires importing or
executing `dist/renderer.js`.

## Complete document boundary

Every page renderable validates the supplied document against the packed
canonical-document schema. The CMS owns the completed rendering input,
including:

- canonical URLs and article/reference URLs;
- pre-distributed `homepageSlots` and explicit homepage visibility flags;
- `logoLink`, `statusVariant`, and localized `searchCopy` when applicable;
- structured `seo.socialImage` data;
- extracted vendor identifiers such as `tweetId` and TikTok `videoId`;
- optional, validated public RUM configuration.

The browser and Node renderers remain as local and Storybook compatibility
exports. They render the same completed document without composing editorial
state or deriving vendor identifiers.

## Templates, helpers, and embeds

The manifest names every direct partial dependency in source order. Dynamic
partials, inline partial decorators, and partial blocks have been replaced by
ordinary declared partials so Cronkite can validate the graph before serving
requests.

Templates use only the pinned helpers: `eq`, `add`, `slice`, `uppercase`,
`coalesce`, `jsonString`, `embedUrl`, `formatDate`,
`socialImageUrl`, and `socialImageAlt`. X, TikTok, Instagram, and SofaScore
URL shapes are data in `embedRegistry`, not executable package helpers. The
social-card template accepts caller-supplied `qrCodeHtml`; QR generation is
not part of declarative rendering.

SofaScore embeds are optional. Live-story and breaking-news templates guard
the entire embed section on `sofascore_id` and expand both URLs without
changing the document context. A missing identifier omits the section; it is
never passed to Cronkite's fail-closed `embedUrl` helper.

The conditional RUM loader is a declared Handlebars partial. It retains
pathname-only page IDs, strips resource performance entries, disables cookies,
X-Ray, resource URLs, and automatic page views, and rejects sensitive error
payloads without requiring a JavaScript renderer import.

## System pages and localization

The manifest declares 404 and search pages as explicit English, Spanish, and
Italian variants. English is Fifthbell's default language, so its object keys
and routes are unprefixed:

- `html/404/index.html` at `/404`;
- `html/search/index.html` at `/search`.

Spanish and Italian variants retain `/es/` and `/it/` prefixes. Each variant
contains a complete document. Search headings, controls, empty states, result
messages, pagination, loading text, and failure text come from the document's
localized `searchCopy`. `outletConfig.searchTitle` is no longer part of the
contract.

## Static and raster assets

The manifest maps every packed font, the font stylesheet, and the compiled
Brokaw stylesheet to exact output keys with content types and immutable cache
policy. Page shells link to the published stylesheet instead of expecting CSS
to be injected by renderer code.

The `social-image` renderable retains JPEG rasterization at 1080 by 1350. Its
input schema requires `imageUrl`, `categoryName`, `title`, and
caller-supplied `qrCodeHtml`.

Brokaw's legacy live-program and short-video exports remain available to their
existing direct consumers, but they are not members of the declarative page
artifact.

## Verification

`npm run build` validates and emits the artifact, copies schemas and fonts,
and verifies the retained live-program bundle. Unit tests cover schema
validation, manifest alignment, explicit system-page keys and routes, static
assets, embed data, and output parity between declarative rendering and the
legacy local renderer for article, homepage, category, search, and link-in-bio
documents. `npm run build-storybook` verifies the updated page, partial, RUM,
standalone-page, and social-image stories.
