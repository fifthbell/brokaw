# @fifthbell/brokaw

Server-side renderer and Handlebars template bundle for fifthbell pages.

## What it does

- Renders canonical content documents into HTML
- Supports every layout declared by the packaged Cronkite manifest, including
  article, homepage, category, search, 404, live-story, link-in-bio, media, and
  standalone pages
- Ships reusable Handlebars templates, partial dependency metadata, and compiled CSS
- Ships the complete Fifthbell live-program page, renderer media, local fonts, and a versioned integrity manifest
- Ships a CLS-owned social-image renderable and provider-neutral Remotion short-video renderable

## Installation

```bash
npm install @fifthbell/brokaw
```

## Basic usage

```ts
import { render } from "@fifthbell/brokaw";

const html = render(doc);
```

`doc` must match the normative canonical schema in
[src/schemas/canonical-document.schema.json](src/schemas/canonical-document.schema.json).
TypeScript declarations are generated from that schema; runtime rendering validates
against the same artifact.

### Optional real user monitoring

Public pages render without monitoring unless a complete `rumConfig` is supplied. The contract requires the public app monitor ID, application version, AWS region, Cognito identity pool ID, and guest role ARN. Brokaw validates the complete configuration and does not embed tenant deployment identifiers in the package.

When enabled, the shared standard and 404 shells collect only performance and filtered JavaScript-error telemetry. Page IDs use `window.location.pathname`; cookies, HTTP telemetry, resource URLs, X-Ray, and replay are disabled. Loader failures are isolated from page rendering and navigation.

## Exports

- `@fifthbell/brokaw` -> renderer entrypoint
- `@fifthbell/brokaw/cronkite-manifest.json` -> data-only CLS capability manifest
- `@fifthbell/brokaw/video` -> bundleable Remotion short-video entrypoint
- `@fifthbell/brokaw/schemas/canonical-document.schema.json` -> canonical input contract
- `@fifthbell/brokaw/schemas/cronkite-manifest.schema.json` -> CLS manifest contract
- `@fifthbell/brokaw/schemas/feed-renderable-input.schema.json` -> CMS-owned feed renderable input boundary
- `@fifthbell/brokaw/schemas/live-program-release-input.schema.json` -> generic live-program release input
- `@fifthbell/brokaw/partial-deps.json` -> partial-to-layout dependency map

The root module also exports `cronkiteManifest`, `outletConfig`, `version`,
`render`, `fontFiles`, `buildInstagramImageHtml`, and
`liveProgramReleaseFiles`. See [docs/cronkite-compatibility.md](docs/cronkite-compatibility.md)
for ownership, validation, system-page, asset, and release-ordering details.

## Fifthbell live-program bundle

`liveProgramPageFiles()` returns the deployable bundle as deterministic `{ key, body, contentType }` entries. It includes `index.html`, versioned JavaScript and CSS, every image/audio/font dependency, and `live-program-manifest.json`. The manifest records the Brokaw package version, renderer schema version, file byte sizes, content types, and SHA-256 digests. It is also an `alcantara.program-template` contract: it declares the renderer entrypoint, supported capabilities, accepted signals, and the runtime parameters Alcantara supplies. A publisher such as Cronkite must upload every returned key under the same public prefix; the relative URLs then work at any Cronkite-owned path.

`liveProgramReleaseFiles({ programId, apiBaseUrl })` is the manifest-declared
request renderable. It preserves the raw bundle export, emits versioned release
objects, and places the configured `html/program.html` commit point last.

```ts
import { liveProgramPageFiles } from "@fifthbell/brokaw";

for (const file of liveProgramPageFiles()) {
  await publish({
    key: file.key,
    body: file.body,
    contentType: file.contentType,
  });
}
```

The standalone renderer uses Alcantara's public, program-scoped contract:

- initial snapshot: `GET /program/:programId/state`
- updates: `GET /program/:programId/events` as server-sent events
- state ordering: the non-negative integer `version` supplied by Alcantara
- renderer schema: `schemaVersion: 1` when present; absent schema versions remain compatible with Alcantara's current v1 payload

Alcantara registers the versioned public URL of `live-program-manifest.json`, resolves the relative `entrypoint`, and uses the declared `capabilities` to expose only applicable controls. The `control.signals` allowlist is the complete set of SSE signal types this renderer accepts; adding renderer behavior requires updating that contract in the same release.

Cronkite can configure a published bundle at runtime by defining `window.__FIFTHBELL_LIVE_PROGRAM_CONFIG__ = { programId, apiBaseUrl }` before the module script runs, or by supplying `programId` and `apiBaseUrl` query parameters. Build-time `VITE_PROGRAM_ID` (default `fifthbell`) and `VITE_API_BASE_URL` are fallbacks. The API base can be an Alcantara origin, an origin ending in `/program`, or the complete `/program/:programId` endpoint; the complete endpoint form remains compatible with existing builds.

The renderer keeps its last valid state while SSE is unavailable, reconnects automatically, and fetches a fresh snapshot before consuming each new stream. Newer snapshots reconcile missed events; malformed, cross-program, incompatible-schema, stale, and out-of-order updates are ignored with a diagnostic console warning.

All presentation files are owned and packaged by Brokaw. Alcantara supplies state and events only; it is not an asset origin.

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npm run build
npm run verify:packed-contract
npm pack --dry-run
npm run storybook
```

## Publish flow

- CI validates typecheck, unit tests, and package build on pull requests and `main` pushes.
- Package publish is triggered by pushing a `v*` tag.

### Mediathek

The `media-page` renderer emits one shared page for `/mediathek/<assignment-key>`.
Its browser script selects the assignment from the URL and fetches
`contents/assignments/<key>.json`; neither the HTML nor its canonical document is
assignment-specific. Storybook `Pages/MediaPage` uses Mediathek URLs.

## Pull request verification

Local agent review uses the shared `clouseau` skill with the developer's
authenticated coding harness and the `.clouseau-local.json` recipe; it needs no
CI provider keys. `AGENTS.md` owns the rule: run it against the final committed
change before opening a PR, repair findings, and publish the passing signed
receipt in the initial ready PR body. Never push directly to `main`.

Every PR runs:

- `npm run typecheck`,
- `npm run test:coverage`: the Vitest `unit` project under V8 coverage with exactly 100% line and branch coverage required over `src`,
- `npm run build` and the packed declarative contract check (`node scripts/verify-packed-contract.mjs`),
- the workflow-contract tests in `.github/tests`.

The Clouseau gate requires exactly 100% line and branch coverage over every
non-test file in `src`; new behaviour needs a test, never a coverage pragma.
Until the suite reaches that bar the coverage step fails, so a PR stays in
human review and is merged by the owner rather than automatically.

A PR carrying an authenticated local review stamp is verified by the pinned
Clouseau engine without AI credentials; unstamped PRs use the CI reviewer.
Passing reviews receive a bot approval and native auto-merge. Unresolved
product-direction questions go to the owner, and changes to review controls need
the owner's `/approve-intent <head SHA>` comment. See [the purpose
contract](.github/clouseau.md). The CI engine is resolved from protected
Clouseau `main` at the start of each run (see
[automatic Clouseau CI upgrades](https://github.com/gaulatti/clouseau/blob/main/docs/automatic-ci-upgrades.md)).

Package publication and the Storybook deployment stay separate, explicitly
authorized workflows outside this review contract.

CI needs these repository secrets: `DEEPSEEK_API_KEY` and `TYPESAFE_API_KEY` for
the CI reviewer, and `DEPLOYMENT_TOKEN` (a token with contents write access
from an identity other than `github-actions[bot]`) for automatic repairs.
