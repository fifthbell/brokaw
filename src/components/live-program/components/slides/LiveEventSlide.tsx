import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { FastAverageColor } from 'fast-average-color';
import qrcode from 'qrcode-generator';
import type { LiveEventData, LiveEventUpdate } from '../../segments/fetchLiveEvents.js';
import type { SupportedLanguage } from '../../i18n.js';
import { t } from '../../i18n.js';
import { buildSofascoreAttackMomentumUrl } from '../../../../utils/sofascore.js';

const fac = new FastAverageColor();

function buildQrCodeUrl(value: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  let rawSvg = qr.createSvgTag(5, 0);
  rawSvg = rawSvg.replace(/fill="(?:#ffffff|white)"/i, 'fill="transparent"');
  rawSvg = rawSvg.replace(/fill="(?:#000000|black)"/i, 'fill="white"');
  const encodedSvg = encodeURIComponent(rawSvg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

function formatUpdateTime(update: LiveEventUpdate): string {
  if (update.timestamp) {
    const d = new Date(update.timestamp);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return update.time || '';
}

function LatestUpdates({ updates, language }: { updates: LiveEventUpdate[]; language: SupportedLanguage }) {
  const latest = useMemo(() => updates.slice(0, 5), [updates]);

  if (latest.length === 0) {
    return (
      <p className="text-white/50 font-['Libre_Franklin'] text-xl">{t('liveEvent.noUpdates', language)}</p>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {latest.map((update, i) => (
        <div key={i} className='flex gap-3 items-start'>
          <div className='w-2 h-2 rounded-full bg-[#4FC3F7] flex-shrink-0 mt-2' />
          <div className='flex flex-col gap-0.5 min-w-0'>
            {formatUpdateTime(update) && (
              <span className="text-sm font-semibold text-[#0ea5e9] font-['Libre_Franklin']">{formatUpdateTime(update)}</span>
            )}
            {update.html ? (
              <div className="text-white/90 text-lg leading-snug font-['Libre_Franklin'] [&_img]:hidden">{update.html.replace(/<[^>]*>/g, '')}</div>
            ) : update.text ? (
              <p className="text-white/90 text-lg leading-snug font-['Libre_Franklin'] truncate">{update.text}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScrollingTimeline({ updates, language }: { updates: LiveEventUpdate[]; language: SupportedLanguage }) {
  const [visibleStart, setVisibleStart] = useState(0);
  const displayCount = 4;
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (updates.length <= displayCount) return;

    cycleRef.current = setInterval(() => {
      setVisibleStart((prev) => (prev + 1) % updates.length);
    }, 5000);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [updates.length]);

  const visibleUpdates = useMemo(() => {
    if (updates.length <= displayCount) return updates;
    const items = [];
    for (let i = 0; i < displayCount; i++) {
      items.push(updates[(visibleStart + i) % updates.length]);
    }
    return items;
  }, [updates, visibleStart, displayCount]);

  if (updates.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className="text-white/50 font-['Libre_Franklin'] text-2xl">{t('liveEvent.noUpdates', language)}</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col justify-center gap-5 h-full'>
      {visibleUpdates.map((update, i) => (
        <div key={`${visibleStart}-${i}`} className='flex gap-4 items-start animate-slide-up'>
          <div className='w-3 h-3 rounded-full bg-[#4FC3F7] flex-shrink-0 mt-1.5 shadow-[0_0_12px_rgba(79,195,247,0.5)]' />
          <div className='flex flex-col gap-1 min-w-0 flex-1'>
            {formatUpdateTime(update) && (
              <span className="text-sm font-semibold text-[#4FC3F7] font-['Libre_Franklin'] tracking-wide">{formatUpdateTime(update)}</span>
            )}
            {update.html ? (
              <div className="text-white text-xl leading-snug font-['Libre_Franklin'] font-light [&_img]:hidden [&_a]:text-[#4FC3F7] [&_a]:underline">{update.html.replace(/<[^>]*>/g, '')}</div>
            ) : update.text ? (
              <p className="text-white text-xl leading-snug font-['Libre_Franklin'] font-light line-clamp-2">{update.text}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LiveEventSlideProps {
  event: LiveEventData;
  progress: number;
  language: SupportedLanguage;
}

export function LiveEventSlide({ event, progress, language }: LiveEventSlideProps) {
  const [dominantColor, setDominantColor] = useState('#b21100');
  const isSports = typeof event.sofascore_id === 'number' && event.sofascore_id > 0;
  const qrCodeUrl = useMemo(() => buildQrCodeUrl(event.liveUrl || event.url), [event.liveUrl, event.url]);
  const sofascoreWidgetUrl = useMemo(() => {
    if (!isSports) return '';
    return buildSofascoreAttackMomentumUrl(event.sofascore_id!, 'dark');
  }, [isSports, event.sofascore_id]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const color = fac.getColor(e.currentTarget);
      setDominantColor(color.hex);
    } catch {
      setDominantColor('#b21100');
    }
  }, []);

  if (isSports) {
    return (
      <div className='absolute inset-0'>
        <div className='absolute inset-0'>
          <img key={event.image} src={event.image} alt='' crossOrigin='anonymous' onLoad={handleImageLoad} className='w-full h-full object-cover blur-xl scale-105' />
        </div>
        <div className='absolute inset-0 opacity-75 mix-blend-multiply transition-all duration-1000' style={{ background: `linear-gradient(to bottom right, ${dominantColor}, #000000)` }} />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]' />

        <div className='relative z-10 grid grid-cols-12 h-full'>
          <div className='col-span-5 flex flex-col justify-center p-16 relative bg-black/35 backdrop-blur-2xl'>
            <div className='animate-slide-up flex flex-col items-start'>
              <span className="inline-flex items-center px-4 py-1.5 bg-[#cc0000] text-white text-xl font-bold tracking-[0.08em] uppercase font-['Encode_Sans_Condensed'] mb-4">LIVE</span>
              <span className="text-white/80 text-2xl font-semibold uppercase tracking-wider mb-2 font-['Encode_Sans_Condensed']">{event.category}</span>
              <div className='w-16 h-1.5 bg-[#b21100] mb-6' />
              <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight line-clamp-5 font-['Encode_Sans'] [text-wrap:balance] text-white">{event.title}</h1>
              {event.excerpt && (
                <p className="text-2xl font-light leading-relaxed opacity-80 line-clamp-3 font-['Libre_Franklin'] text-white mb-6">{event.excerpt}</p>
              )}
              <LatestUpdates updates={event.updates} language={language} />
            </div>
          </div>

          <div className='col-span-7 relative h-full flex items-center justify-center p-12 pb-32'>
            <div className='relative w-full max-w-lg flex flex-col gap-4'>
              <div className='relative aspect-video shadow-2xl overflow-hidden border border-white/10'>
                <div className='absolute top-0 left-0 h-1 bg-white/30 w-full z-20'>
                  <div className='h-full bg-white transition-all duration-100 ease-linear' style={{ width: `${progress}%` }} />
                </div>
                <img
                  key={event.image}
                  src={event.image}
                  alt={event.alt}
                  className='w-full h-full object-cover'
                  style={{ animation: 'kenburns 20s infinite alternate' }}
                  crossOrigin='anonymous'
                />
              </div>

              {sofascoreWidgetUrl && (
                <div className='w-full overflow-hidden border border-white/10 bg-black/40'>
                  <iframe
                    width='100%'
                    height='180'
                    src={sofascoreWidgetUrl}
                    title='SofaScore Attack Momentum'
                    frameBorder='0'
                    scrolling='no'
                    loading='lazy'
                    referrerPolicy='no-referrer-when-downgrade'
                    style={{ border: 0 }}
                  />
                </div>
              )}

              <div className='absolute bottom-4 right-4 z-30'>
                <div className='p-2 rounded-sm backdrop-blur-md shadow-2xl' style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <img src={qrCodeUrl} alt='QR code' className='block w-24 h-24' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0'>
        <img key={event.image} src={event.image} alt='' crossOrigin='anonymous' onLoad={handleImageLoad} className='w-full h-full object-cover blur-xl scale-105' />
      </div>
      <div className='absolute inset-0 opacity-80 mix-blend-multiply transition-all duration-1000' style={{ background: `linear-gradient(to bottom right, ${dominantColor}, #000000)` }} />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]' />

      <div className='relative z-10 grid grid-cols-12 h-full'>
        <div className='col-span-5 flex flex-col justify-center p-16 relative bg-black/35 backdrop-blur-2xl'>
          <div className='animate-slide-up flex flex-col items-start'>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#cc0000] text-white text-xl font-bold tracking-[0.08em] uppercase font-['Encode_Sans_Condensed'] mb-4">LIVE</span>
            <span className="text-white/80 text-2xl font-semibold uppercase tracking-wider mb-2 font-['Encode_Sans_Condensed']">{event.category}</span>
            <div className='w-16 h-1.5 bg-[#b21100] mb-6' />
            <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight line-clamp-5 font-['Encode_Sans'] [text-wrap:balance] text-white">{event.title}</h1>
            {event.excerpt && (
              <p className="text-2xl font-light leading-relaxed opacity-80 line-clamp-3 font-['Libre_Franklin'] text-white">{event.excerpt}</p>
            )}
          </div>
        </div>

        <div className='col-span-7 relative h-full flex flex-col justify-center p-16 pl-12'>
          <div className='flex items-start gap-4 mb-8'>
            <div className='bg-[#b21100] text-white px-4 py-2 shadow-lg'>
              <SecondBellIcon size={32} />
            </div>
            <h2 className="text-white/60 text-2xl font-semibold uppercase tracking-[0.12em] font-['Encode_Sans_Condensed']">LIVE UPDATES</h2>
          </div>
          <ScrollingTimeline updates={event.updates} language={language} />
          <div className='absolute bottom-8 right-8 z-30'>
            <div className='p-2 rounded-sm backdrop-blur-md shadow-2xl' style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <img src={qrCodeUrl} alt='QR code' className='block w-24 h-24' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecondBellIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M10.268 21a2 2 0 0 0 3.464 0' />
      <path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' />
      <path d='M4 2C2.8 3.7 2 5.7 2 8' />
      <path d='M22 8a10 10 0 0 0-2-6' />
    </svg>
  );
}
