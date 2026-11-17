import { fetchEventsRetained, type Event } from './events.js';
import { type SupportedLanguage } from './i18n.js';
import { fetchArticles, type NewsItem } from './segments/ArticlesSegment.js';
import { fetchEarthquakes, type EarthquakeData } from './segments/EarthquakeSegment.js';
import { fetchLiveEvent, type LiveEventData } from './segments/fetchLiveEvents.js';
import { fetchMarketData, type MarketData } from './segments/MarketsSegment.js';
import { fetchWeatherData, type WeatherRegionData } from './segments/WeatherSegment.js';

export { SOURCE_RETENTION_MS } from './source-retention.js';

export interface ProgramData {
  articles: NewsItem[];
  weather: WeatherRegionData[];
  earthquakes: EarthquakeData[];
  markets: MarketData[];
  liveEvent: LiveEventData | null;
  events: Event[];
}

/**
 * Loads every live-program source at once. No source can hold the others
 * back: each one answers with its own fallback when it fails, and events keep
 * their last good list for SOURCE_RETENTION_MS.
 */
export async function loadProgramData(language: SupportedLanguage): Promise<ProgramData> {
  const [articles, weather, earthquakes, markets, liveEvent, events] = await Promise.all([
    fetchArticles(language),
    fetchWeatherData(),
    fetchEarthquakes(language),
    fetchMarketData(),
    fetchLiveEvent(language),
    fetchEventsRetained({ language, allowedLanguages: [language] }),
  ]);
  return { articles, weather, earthquakes, markets, liveEvent, events };
}
