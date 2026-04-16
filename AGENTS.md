# Brokaw Agent Rules

## Mandatory Story Updates

Any change to UI/template/render surface **must** include a Storybook update in the same change set.

This includes changes under:
- `src/templates/layouts/**`
- `src/templates/partials/components/**`
- `src/templates/partials/headers/**`
- `src/renderer.core.ts`
- `src/renderer.browser.ts`
- `src/renderer.node.ts`
- `src/types/canonical-article.ts`

Accepted story updates include any file under:
- `stories/**`

## Execution Rule For AI Assistants

Before considering work complete, AI assistants must:
1. Check whether any files in the required paths changed.
2. If yes, add or update at least one story under `stories/**` in the same task.
3. Mention the story file(s) updated in the final response.

## Storybook Registration Rule

This repository uses an explicit Storybook story list in `.storybook/main.ts`.

When adding a new top-level page story (for example `stories/SearchPage.stories.ts`), AI assistants must also:
1. Register the story file path in `.storybook/main.ts`.
2. Update story ordering in `.storybook/preview.ts` (`parameters.options.storySort.order`) when needed.
