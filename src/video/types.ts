export type ShortVideoBrand = {
  name: string;
  siteUrl: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export type HookSlide = {
  type: "HOOK";
  title: string;
  byline: string;
  durationInFrames: number;
};

export type ArticleSlide = {
  type: "ARTICLE";
  title: string;
  excerpt: string;
  imageUrl?: string;
  url?: string;
  slug?: string;
  durationInFrames: number;
  articleId?: string | number;
};

export type OutroSlide = {
  type: "OUTRO";
  text?: string;
  durationInFrames: number;
};

export type ShortVideoSlide = HookSlide | ArticleSlide | OutroSlide;

export type ShortVideoProps = Record<string, unknown> & {
  title: string;
  byline: string;
  slides: ShortVideoSlide[];
  audioUrl?: string | null;
  brand: ShortVideoBrand;
};
