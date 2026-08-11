import { useRef, useState, useEffect } from 'react';
import { LiveEventSlide } from '../components/slides/LiveEventSlide.js';
import type { LiveEventData } from './fetchLiveEvents.js';
import { fetchLiveEvent } from './fetchLiveEvents.js';
import type { Segment } from './types.js';
import { t, type SupportedLanguage } from '../i18n.js';

interface LiveEventSegmentRendererProps {
  event: LiveEventData | null;
  progress: number;
  language: SupportedLanguage;
}

function LiveEventSegmentRenderer({ event, progress, language }: LiveEventSegmentRendererProps) {
  if (!event) {
    return (
      <div className='absolute inset-0 bg-black flex items-center justify-center'>
        <p className='text-white/50 text-2xl font-secondary'>{t('liveEvent.noLiveEvents', language)}</p>
      </div>
    );
  }

  return (
    <div className='relative w-full h-full'>
      <LiveEventSlide key={event.title} event={event} progress={progress} language={language} />
    </div>
  );
}

export function createLiveEventSegment(
  liveEvent: LiveEventData | null,
  onDataUpdate?: (next: LiveEventData | null) => void,
  language: SupportedLanguage = 'en'
): Segment {
  return {
    id: 'live-event',
    label: t('segment.liveEvent', language),
    get itemCount() {
      return liveEvent ? 1 : 0;
    },
    durationMsPerItem: 15000,
    render: (itemIndex: number, progress: number) => (
      <LiveEventSegmentRenderer key='live-event-0' event={liveEvent} progress={progress} language={language} />
    ),
    prefetch: async () => {
      if (!onDataUpdate) return;
      const fresh = await fetchLiveEvent(language);
      onDataUpdate(fresh);
    },
  };
}
