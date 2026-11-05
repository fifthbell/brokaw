import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import config from "./main.js";

const configDir = fileURLToPath(new URL(".", import.meta.url));

describe("Storybook main configuration", () => {
  it("uses the HTML Vite framework with the required addons", () => {
    expect(config.framework).toBe("@storybook/html-vite");
    expect(config.addons).toEqual([
      "@chromatic-com/storybook",
      "@storybook/addon-vitest",
      "@storybook/addon-a11y",
      "@storybook/addon-docs",
    ]);
  });

  it("lists the Mediathek story and every explicit story file exists", () => {
    const stories = config.stories as string[];
    expect(stories).toContain("../stories/MediaPage.stories.ts");
    for (const story of stories.filter((entry) => !entry.includes("*"))) {
      expect(existsSync(resolve(configDir, story)), story).toBe(true);
    }
  });

  it("serves the same-origin Mediathek HTTP fixture and its siblings", () => {
    const staticDirs = config.staticDirs as { from: string; to: string }[];
    const mediathek = staticDirs.find((entry) => entry.to === "/mediathek");
    expect(mediathek?.from).toBe("../stories/fixtures/mediathek-http");
    const mediathekDirectory = resolve(configDir, mediathek!.from);
    expect(readdirSync(mediathekDirectory).length).toBeGreaterThan(0);
    for (const { from } of staticDirs) {
      expect(existsSync(join(configDir, from)), from).toBe(true);
    }
    expect(new Set(staticDirs.map((entry) => entry.to)).size).toBe(
      staticDirs.length,
    );
  });

  it("keeps the incoming Vite config and treats .hbs files as assets", async () => {
    const incoming = { root: "/fictional", assetsInclude: ["**/*.png"] };
    const result = await config.viteFinal!(incoming as never, {} as never);
    expect(result).toMatchObject({ root: "/fictional" });
    expect(result.assetsInclude).toEqual(["**/*.hbs"]);
  });
});
