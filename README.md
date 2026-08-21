# @fifthbell/brokaw

Server-side renderer and Handlebars template bundle for fifthbell pages.

## What it does

- Renders canonical content documents into HTML
- Supports `article-page`, `homepage`, `category-page`, `live-story`, and `404` layouts
- Ships reusable Handlebars templates, partial dependency metadata, and compiled CSS

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

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npm run build
npm run storybook
```

## Publish flow

- CI validates typecheck, unit tests, and package build on pull requests and `main` pushes.
- Package publish is triggered by pushing a `v*` tag.
