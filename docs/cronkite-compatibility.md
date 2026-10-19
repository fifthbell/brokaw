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

`media-page` additionally requires the canonical `assignmentMediaBaseUrl`:
an absolute HTTP(S) directory ending in `/contents/assignments/` with a trailing
slash and no credentials, query or fragment. The producer preserves any
configured path/bucket prefix. Brokaw validates and embeds the supplied value
with `jsonString`, then the browser appends the encoded opaque route key and
`.json`. It does not reconstruct that base from the browser origin or another
field. The package's static system document has an explicit authored Fifthbell
preview value; Cronkite's basement producer replaces it from the selected
tenant's CDN configuration, while direct CMS requests supply their own value.

The packed self-contained canonical schema and generated TypeScript remain
contract version 1. This is a coordinated tightening of `media-page` input:
an older media document without the field fails validation. Other layouts do
not require it, and unrelated extra properties remain allowed. Deploy the
compatible CMS mint/input producer and Cronkite input producer before adopting
the new package. Source version `0.1.72` remains an unpublished candidate;
these contents need their own reviewed artifact and release decision.

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

The Mediathek unit boundary executes the actual rendered inline script against
controlled public-fetch responses, including supplied loopback/bucket bases,
opaque keys, errors, empty data, refresh and pagination. Existing gallery
stories retain their manually hydrated visual fixtures. In contrast,
`Pages/MediaPage/FetchedSystemPage` runs the rendered script in a same-origin
frame at a fictional Mediathek path and fetches repository-owned assignment
JSON and an image over actual Storybook HTTP. Those static fixtures are outside
the package's published file set. These checks do not establish normal deployed
CMS/Cronkite publication, stored output, or public package adoption.

## Article reading and attribution

The article page fills the available width and keeps its header, update notice,
share controls and body inside the explicit grid with `col-span-full`. A fixed
twelve-column span at the mobile one-column breakpoint creates implicit tracks
and can make the text wider than a narrow reading frame. Desktop-specific image,
share and body spans retain their existing twelve-column placement.

The article main uses Tailwind 4.2.2's `wrap-anywhere` utility so long unbroken
headlines, excerpts and body text can wrap without changing or truncating the
supplied words. Every canonical `authors[].name` appears in supplied order using
the existing editorial metadata style. Handlebars escapes names as text. An empty
author array omits the byline. The existing publication date and canonical input
requirements remain in force; these changes retain template contract version 1
and add no required document fields.

`Pages/Article reading` supplies deterministic published `PublishedStory`,
`WithLeadImage`, `WithUpdatedVersion`, `LongUnbrokenHeadline` and `MultipleAuthors`
stories without a preview-data service. Inspect direct story iframes at 236px,
306px, 390px, 768px and 1440px. Check the opening paragraph, quote, attribution,
closing paragraph, supplied image URL, optional update notice and desktop
share/body placement. Rendered-markup regressions verify these boundaries and
author escaping; browser layout acceptance must also exercise the generated CSS.

Local acceptance on 17 October 2026 passed all 25 combinations of those five
stories and widths. The complete story, lead image, update notice, wrapping,
ordered byline and desktop share/body placement remained within the article
frame. At 390px and 1440px, native Tab/Shift+Tab traversal reached the eight
share links and the updated-version link with visible focus; no link was
activated.

The check used native Chrome's responsive Desktop engine at 50% preview, with
actual toolbar widths and screenshots checked. Physical-device and VoiceOver
acceptance were outside that check. A local favicon 404 was observed; the
record makes no globally clean-console claim. The shared shell retains its
existing public fixed-city weather requests. Screenshots were emitted in the
acceptance conversation. The acceptance record is `acceptance-v3.json`,
SHA-256 `692322950b8adf2b411bc1e40acb9222e3489b2f0ea5356f7cb05def48d9b805`.
These are local acceptance results; the separate delivery steps below still
apply.

This repair needs both the package templates and the compiled stylesheet.
The page shell continues to request the established published Brokaw stylesheet.
At release preparation on 17 October 2026, that served stylesheet already
contained the full-span and width utilities needed for the grid repair, but did
not contain `wrap-anywhere` or an `overflow-wrap:anywhere` declaration. The grid
correction can use those existing rules; the complete long-word repair requires
activation of the newly generated stylesheet.
Publishing an npm package alone does not activate its CSS or change existing
article HTML. Release verification must confirm the selected consumer accepts
the contract-1 package, deliver its generated CSS through the existing static-asset
path, verify the served stylesheet includes `overflow-wrap:anywhere`, rerender
affected articles, and inspect the final public output and cache activation.
No renderer URLs, asset-authority policy, publishing permissions or backend
telemetry change in this repair. The public wiki remote was unavailable, so this
contract is documented here.
