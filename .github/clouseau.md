# Brokaw review contract

Brokaw (`@fifthbell/brokaw`) is the server-side renderer and Handlebars template bundle for Fifthbell pages. It
renders canonical content documents into HTML for every layout declared by the
packaged Cronkite manifest, and ships the templates, partial dependency
metadata, compiled CSS, fonts and the live-program page that downstream
publishing consumes as a versioned npm package.

Preserve the rendering contract: the packaged manifest and its layouts, the
declarative templates and explicit partial dependencies, the canonical document
shape, the packed declarative contract that consumers verify, and the
integrity manifest of shipped assets. A change to a template, layout or
renderer needs a Storybook story or test that shows the output a consumer sees,
as `AGENTS.md` requires. Bug fixes, meaningful tests, accessibility,
documentation and dependency maintenance serve this existing package without a
new product decision. A new layout, a breaking contract change or a new
runtime dependency needs documentation or a linked requirement that establishes
its need and boundaries. Package publication and the Storybook deployment stay
separate, explicitly authorized workflows outside this review contract.

Assess purpose and evidence rather than the number of changed files or lines.
Ask gaulatti for a second opinion for a product-direction or authority decision.
Ordinary implementation uncertainty and repairable bugs belong to automated
investigation, not routine human code review. Changes to review controls (this
contract, `.github/clouseau.json`, the CI workflow, the local recipe) require
explicit owner confirmation.

Every material capability and mechanism must independently score at least 80
for fit, need and proportionality under Clouseau's shared protocol. A causal
technical finding at or above 70 blocks; unrelated features or good scores
cannot average away a defect. Integrity and review-completeness gates remain
independent.

Tests must assert actual rendered output or contract behaviour. Reject
fabricated coverage, disabled tests, coverage pragmas or exclusions, swallowed
errors, unconditional assertions and mocks that replace the behaviour being
claimed. The type check, unit tests, package build and packed-contract
verification remain mandatory, and every pull request must keep exactly 100%
line and branch coverage of `src`; a pull request below that stays for human
review.
