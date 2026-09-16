import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type {
  ArticleSlide as ArticleSlideData,
  HookSlide as HookSlideData,
  OutroSlide as OutroSlideData,
  ShortVideoBrand,
  ShortVideoProps,
  ShortVideoSlide,
} from "./types.js";

const fill: React.CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  padding: 96,
};

function Background({
  brand,
  imageUrl,
}: {
  brand: ShortVideoBrand;
  imageUrl?: string;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });
  const source = imageUrl ?? brand.backgroundImageUrl;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${brand.primaryColor ?? "#b21100"}, ${brand.secondaryColor ?? "#111827"})`,
      }}
    >
      {source ? (
        <Img
          src={source}
          style={{
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
            transform: `scale(${scale})`,
            width: "100%",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.82))",
        }}
      />
    </AbsoluteFill>
  );
}

function BrandMark({ brand }: { brand: ShortVideoBrand }) {
  return brand.logoUrl ? (
    <Img
      src={brand.logoUrl}
      style={{ maxHeight: 220, maxWidth: 640, objectFit: "contain" }}
    />
  ) : (
    <div style={{ color: "white", fontSize: 74, fontWeight: 800 }}>
      {brand.name}
    </div>
  );
}

function HookSlide({
  slide,
  brand,
}: {
  slide: HookSlideData;
  brand: ShortVideoBrand;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={fill}>
      <Background brand={brand} />
      <div
        style={{
          color: "white",
          opacity: entrance,
          position: "relative",
          textAlign: "center",
          transform: `translateY(${interpolate(entrance, [0, 1], [60, 0])}px)`,
        }}
      >
        <BrandMark brand={brand} />
        <h1 style={{ fontSize: 108, lineHeight: 1.02, margin: "92px 0 28px" }}>
          {slide.title}
        </h1>
        <p style={{ fontSize: 42, margin: 0 }}>{slide.byline}</p>
      </div>
    </AbsoluteFill>
  );
}

function ArticleSlide({
  slide,
  brand,
}: {
  slide: ArticleSlideData;
  brand: ShortVideoBrand;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame: frame - 8, fps, config: { damping: 24 } });
  const articleUrl = slide.url
    ? slide.url
    : `${brand.siteUrl.replace(/\/$/, "")}/${(slide.slug ?? "").replace(/^\//, "")}`;

  return (
    <AbsoluteFill style={{ ...fill, alignItems: "flex-end" }}>
      <Background brand={brand} imageUrl={slide.imageUrl} />
      <div
        style={{
          color: "white",
          opacity: entrance,
          position: "relative",
          textShadow: "0 4px 18px rgba(0,0,0,0.55)",
          transform: `translateY(${interpolate(entrance, [0, 1], [80, 0])}px)`,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700 }}>{brand.name}</div>
        <h2 style={{ fontSize: 88, lineHeight: 1.08, margin: "28px 0" }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: 44, lineHeight: 1.35, margin: "0 0 52px" }}>
          {slide.excerpt}
        </p>
        <div style={{ fontSize: 30, opacity: 0.88 }}>{articleUrl}</div>
      </div>
    </AbsoluteFill>
  );
}

function OutroSlide({
  slide,
  brand,
}: {
  slide: OutroSlideData;
  brand: ShortVideoBrand;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={fill}>
      <Background brand={brand} />
      <div
        style={{
          opacity: entrance,
          position: "relative",
          textAlign: "center",
          transform: `scale(${interpolate(entrance, [0, 1], [0.86, 1])})`,
        }}
      >
        <BrandMark brand={brand} />
        <div style={{ color: "white", fontSize: 44, marginTop: 72 }}>
          {slide.text ?? brand.siteUrl}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Slide({
  slide,
  brand,
}: {
  slide: ShortVideoSlide;
  brand: ShortVideoBrand;
}) {
  if (slide.type === "HOOK") return <HookSlide slide={slide} brand={brand} />;
  if (slide.type === "ARTICLE") {
    return <ArticleSlide slide={slide} brand={brand} />;
  }
  return <OutroSlide slide={slide} brand={brand} />;
}

export function getDurationInFrames(slides: ShortVideoSlide[]): number {
  return slides.reduce((total, slide) => total + slide.durationInFrames, 0);
}

export function ShortVideo({ slides, audioUrl, brand }: ShortVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = getDurationInFrames(slides);
  const volume = interpolate(
    frame,
    [Math.max(0, totalFrames - fps), totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  let from = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {slides.map((slide, index) => {
        const start = from;
        from += slide.durationInFrames;
        return (
          <Sequence
            key={`${slide.type}-${index}`}
            from={start}
            durationInFrames={slide.durationInFrames}
          >
            <Slide slide={slide} brand={brand} />
          </Sequence>
        );
      })}
      {audioUrl ? <Audio src={audioUrl} volume={volume} /> : null}
    </AbsoluteFill>
  );
}
