import { createContext, useContext } from 'react';

/** The program's images and sound under one base path (no trailing slash). */
export function fifthBellAssets(base: string) {
  const root = base.replace(/\/+$/, '');
  return {
    audio: {
      pipes: `${root}/audio/pipes.ogg`
    },
    images: {
      logo: `${root}/images/fifthbell.png`,
      nyc: `${root}/images/nyc.jpg`,
      berlin: `${root}/images/berlin.jpg`,
      santiago: `${root}/images/santiago.jpg`,
      tokyo: `${root}/images/tokyo.jpg`,
      nyse: `${root}/images/nyse.jpg`,
      seismograph: `${root}/images/seismograph.jpg`
    }
  } as const;
}

export type FifthBellAssets = ReturnType<typeof fifthBellAssets>;

/** Brokaw's own page serves the assets beside it. */
export const DEFAULT_FIFTHBELL_ASSET_BASE = './fifthbell';
export const FIFTHBELL_ASSETS: FifthBellAssets = fifthBellAssets(DEFAULT_FIFTHBELL_ASSET_BASE);

/**
 * Where the program's assets live for the current host: Brokaw's own page by default; a host
 * that embeds LiveProgram elsewhere (Alcántara's /program/<id>) passes `assetBaseUrl`.
 */
export const FifthBellAssetsContext = createContext<FifthBellAssets>(FIFTHBELL_ASSETS);
export const useFifthBellAssets = (): FifthBellAssets => useContext(FifthBellAssetsContext);
