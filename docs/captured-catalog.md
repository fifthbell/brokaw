# Dormant captured-catalog contract

Internal foundation for Brokaw #29, part of #21. No renderer, template, browser
script, root export or manifest calls `src/captured-catalog.ts`. Package version
and publication are unchanged. #30 owns reader integration; #31 owns release.
This document defines a new dark interface, not an existing Ariston/Cronkite
export or a deployed selection.

## Source and authority

Inspected Brokaw main `6d507540079b3c0e07ffb32a703b1475a2c404f6`, Ariston main
`b4499a311d8a914fa9ed40dedc827820c4e4a419` and Cronkite main
`0196d186cb6a080c6aa24115541d6421660cb411`. Ariston's
`backend/src/database/site-generation.ts` defines the five-field render context
below; its source captures currently remain server-side. The historical
`selected-site-readers.md` and `frozen-site-producers.md` files named by #21 are
absent at inspected Ariston main. Brokaw's supported locales are `en`, `es`, `it`.

The caller must obtain the expected selection from the authoritative CMS path,
separately from the fetched catalog. The catalog cannot select its own tenant,
locale, public origin or build. This module does not authenticate a caller,
grant publication authority, fetch data, poll, cache or choose a release.

## Version 1

Expected selection has exactly `selectionId`, `catalogUrl`, `context`, `locale`.
The fetched catalog has exactly:

- `contractVersion`: number `1`;
- `selectionId`: the same opaque, nonempty identity;
- `context`: exactly `rendererVersion`, `templateVersion`, `tenant`, `origin`,
  `build`, all equal to the independently supplied expected context;
- `locale`: the same supported locale;
- `state`: `selected` or `withdrawn`;
- `resources`: one to 512 descriptors for a selected catalog. A withdrawal
  needs no usable resources and always rejects reading.

Identity/context tokens are at most 200 characters with no whitespace or control
characters. `context.origin` is a canonical bare HTTPS public origin. The
catalog URL is an issued canonical absolute HTTPS URL without credentials or a
fragment. Its origin may differ from the public page origin, as existing content
does on the CDN; it is supplied explicitly, never guessed from the public origin.

Each resource has exactly `key`, `kind`, `url`, `sha256`. Keys are unique opaque
tokens, not paths from which to reconstruct a URL. Kind is one of `navigation`,
`homepage`, `category`, `assignment`, `media`, `search`, `weather`, `system`.
URLs must be canonical absolute HTTPS locations on the issued catalog's origin,
without credentials or fragments. The exact issued string, including its query,
is preserved. SHA-256 is 64 lowercase hexadecimal characters. A separate origin
requires a future explicit contract; this version does not infer an allowlist.

`resolveCapturedCatalog(undefined, ...)` returns `null`, allowing #30 to retain
the current source only when no selection exists. Null, malformed, stale,
mismatched or withdrawn selections throw a bounded `CapturedCatalogError`;
they never return a legacy URL or an empty success. Unknown descriptor fields,
duplicates and missing requested resources reject too. Error text contains only
the controlled code, not URLs, content or identities.

The resolved object, copied context and copied descriptors are frozen. Looking
up a key also checks its kind. `verifyBytes` checks a resource's SHA-256 over a
private byte copy, up to 8 MiB; unavailable crypto and mismatches fail closed.
The adapter must enforce response/download limits before accumulating bytes,
then verify bytes before parsing or displaying them. A checksum is integrity
evidence within the trusted CMS selection, not an independent authorization.

## Adapter completion boundary

#30 must invalidate old resolved objects when the CMS selection/context changes,
handle unavailable responses explicitly, and never mix selected data with live
mutable JSON. It owns complete paginated inventories, counts/search agreement,
content schema validation, request races, withdrawal/recovery, assets and actual
desktop/narrow/keyboard/Storybook proof. No TTL, fallback producer, filename
convention or publication switch is invented here. A valid descriptor alone
does not prove those behaviors.

Local tests cover the actual validator and byte-integrity boundary. This dormant
module has no backend or metrics collector impact. Existing application metrics
and production/private endpoints are unchanged. No deployment, registry
publication or cross-repository change is part of #29.
