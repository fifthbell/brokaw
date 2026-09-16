import React from "react";
import { Composition } from "remotion";
import { getDurationInFrames, ShortVideo } from "./ShortVideo.js";
import type { ShortVideoProps } from "./types.js";

const defaultProps: ShortVideoProps = {
  title: "Daily briefing",
  byline: "Newsroom",
  brand: {
    name: "Newsroom",
    siteUrl: "https://example.invalid",
    primaryColor: "#182238",
    secondaryColor: "#111827",
  },
  slides: [
    {
      type: "HOOK",
      title: "Daily briefing",
      byline: "Newsroom",
      durationInFrames: 90,
    },
    {
      type: "ARTICLE",
      title: "Example story",
      excerpt: "The caller supplies all editorial copy and brand assets.",
      slug: "example-story",
      durationInFrames: 150,
    },
    {
      type: "OUTRO",
      durationInFrames: 60,
    },
  ],
};

export function RemotionRoot() {
  return (
    <Composition
      id="BrokawShort"
      component={ShortVideo}
      calculateMetadata={({ props }) => ({
        durationInFrames: getDurationInFrames(props.slides),
        fps: 30,
        width: 1080,
        height: 1920,
      })}
      defaultProps={defaultProps}
      durationInFrames={getDurationInFrames(defaultProps.slides)}
      fps={30}
      width={1080}
      height={1920}
    />
  );
}
