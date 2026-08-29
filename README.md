# @fifthbell/brokaw

Server-side renderer and Handlebars template bundle for fifthbell pages.

## What it does

- Renders canonical content documents into HTML
- Supports `article-page`, `homepage`, `category-page`, `live-story`, and `404` layouts
- Ships reusable Handlebars templates, partial dependency metadata, and compiled CSS
- Ships the complete Fifthbell live-program page, renderer media, local fonts, and a versioned integrity manifest

## Installation

```bash
npm install @fifthbell/brokaw
```

## Basic usage

```ts
import { render } from '@fifthbell/brokaw';

const html = render(doc);
```

`doc` must match the canonical schema used by the renderer (see [src/types/canonical-article.ts](src/types/canonical-article.ts)).

### Optional real user monitoring

Public pages render without monitoring unless a complete `rumConfig` is supplied. The contract requires the public app monitor ID, application version, AWS region, Cognito identity pool ID, and guest role ARN. Brokaw validates the complete configuration and does not embed tenant deployment identifiers in the package.

When enabled, the shared standard and 404 shells collect only performance and filtered JavaScript-error telemetry. Page IDs use `window.location.pathname`; cookies, HTTP telemetry, resource URLs, X-Ray, and replay are disabled. Loader failures are isolated from page rendering and navigation.

## Exports

- `@fifthbell/brokaw` -> renderer entrypoint
- `@fifthbell/brokaw/partial-deps.json` -> partial-to-layout dependency map

## Fifthbell live-program bundle

`liveProgramPageFiles()` returns the deployable bundle as deterministic `{ key, body, contentType }` entries. It includes `index.html`, versioned JavaScript and CSS, every image/audio/font dependency, and `live-program-manifest.json`. The manifest records the Brokaw package version, renderer schema version, file byte sizes, content types, and SHA-256 digests. A publisher such as Cronkite must upload every returned key under the same public prefix; the relative URLs then work at any Cronkite-owned path.

```ts
import { liveProgramPageFiles } from '@fifthbell/brokaw';

for (const file of liveProgramPageFiles()) {
  await publish({ key: file.key, body: file.body, contentType: file.contentType });
}
```

The standalone renderer uses Alcantara's public, program-scoped contract:

- initial snapshot: `GET /program/:programId/state`
- updates: `GET /program/:programId/events` as server-sent events
- state ordering: the non-negative integer `version` supplied by Alcantara
- renderer schema: `schemaVersion: 1` when present; absent schema versions remain compatible with Alcantara's current v1 payload

Cronkite can configure a published bundle at runtime by defining `window.__FIFTHBELL_LIVE_PROGRAM_CONFIG__ = { programId, apiBaseUrl }` before the module script runs, or by supplying `programId` and `apiBaseUrl` query parameters. Build-time `VITE_PROGRAM_ID` (default `fifthbell`) and `VITE_API_BASE_URL` are fallbacks. The API base can be an Alcantara origin, an origin ending in `/program`, or the complete `/program/:programId` endpoint; the complete endpoint form remains compatible with existing builds.

The renderer keeps its last valid state while SSE is unavailable, reconnects automatically, and fetches a fresh snapshot before consuming each new stream. Newer snapshots reconcile missed events; malformed, cross-program, incompatible-schema, stale, and out-of-order updates are ignored with a diagnostic console warning.

All presentation files are owned and packaged by Brokaw. Alcantara supplies state and events only; it is not an asset origin.

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npm run build
npm pack --dry-run
npm run storybook
```

## Publish flow

- CI validates typecheck, unit tests, and package build on pull requests and `main` pushes.
- Package publish is triggered by pushing a `v*` tag.
