# Cronkite compatibility

Brokaw owns Fifthbell's renderer identity and declares it through
`cronkiteManifest`. The source object lives in `src/cronkite-manifest.ts`; the
build validates it against the CPS-02 schema and emits
`dist/cronkite-manifest.json`. Consumers can read the JSON export before they
execute package code.

## Identity and drift boundaries

The manifest package and version must match `package.json` and the exported
`version`. Its ordered layout list must match `src/layouts.ts`, and its language
list must match `outletConfig.supportedLanguages`. The build also checks every
declared function export and every packed entry or schema path. A mismatch fails
the build instead of becoming a runtime renderer guess.

The canonical-document TypeScript declaration is generated from
`src/schemas/canonical-document.schema.json`, the CPS-03 normative schema.
Brokaw's runtime validation uses that same JSON Schema. The previous local Zod
copy is not an independent contract.

## Declared system pages

The manifest owns localized copy for 404 and search pages in English, Spanish,
and Italian. The current English and Spanish 404 copy is preserved exactly. The
Italian copy is owned here instead of falling back to English.

The system-page descriptors include their routes, output keys, cache policy,
language expansion, and copy. Brokaw declares `en` as its default and supports
`en`, `es`, and `it`. It intentionally does not declare `coming-soon`, because
no such layout exists in this package.

## Asset renderables and capabilities

Brokaw declares:

- `social-image`, using the existing `buildInstagramImageHtml` HTML-raster
  export at 1080 by 1350 JPEG;
- `short-video`, using the bundleable `dist/video/index.js` Remotion entry and
  `BrokawShort` composition;
- `fonts`, using `fontFiles`.

Brokaw does not declare `capabilities.assets`; it has no `assetFiles` export.
The short-video template accepts caller-owned brand colors, identity, URLs,
logo/background assets, slide copy, and optional audio. It contains no
Fifthbell or Sanremo branding. `npm run verify:packed-remotion` builds and packs
Brokaw, installs the tarball into a clean consumer directory, reads the
data-only manifest, exercises the packed live-program release export, and
bundles the declared video entry from the installed package.

## Live-program release boundary

The existing `liveProgramPageFiles()` export remains unchanged for current
consumers: it returns the validated relative renderer bundle. The manifest
declares the new `liveProgramReleaseFiles(input)` request renderable, which
accepts a safe `programId` and absolute HTTPS `apiBaseUrl` (with loopback HTTP
retained for local development), emits the immutable bundle under
`html/live-program.v<package-version>/`, and appends the configured canonical
`html/program.html` document.

The manifest's `writeOrdering.live-program.last` rule makes
`html/program.html` the commit point. A conforming CPS writes every versioned
release object successfully before it writes that pointer. Brokaw continues to
own and verify the opaque `alcantara.program-template` contents; the CPS only
writes the returned files.
