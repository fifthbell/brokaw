import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDurationInFrames } from "./ShortVideo.js";
import type { ShortVideoSlide } from "./types.js";

describe("short-video template", () => {
  it("derives composition duration from caller-owned slides", () => {
    const slides: ShortVideoSlide[] = [
      { type: "HOOK", title: "Hook", byline: "Desk", durationInFrames: 60 },
      {
        type: "ARTICLE",
        title: "Story",
        excerpt: "Summary",
        durationInFrames: 120,
      },
      { type: "OUTRO", durationInFrames: 30 },
    ];

    expect(getDurationInFrames(slides)).toBe(210);
  });

  it("contains no Fifthbell or Sanremo identity", () => {
    const source = ["Root.tsx", "ShortVideo.tsx", "types.ts"]
      .map((file) =>
        readFileSync(join(process.cwd(), "src", "video", file), "utf8"),
      )
      .join("\n");

    expect(source).not.toMatch(/fifthbell|sanremo/i);
  });
});
