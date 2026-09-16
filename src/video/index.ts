import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root.js";

registerRoot(RemotionRoot);

export { getDurationInFrames, ShortVideo } from "./ShortVideo.js";
export type {
  ArticleSlide,
  HookSlide,
  OutroSlide,
  ShortVideoBrand,
  ShortVideoProps,
  ShortVideoSlide,
} from "./types.js";
