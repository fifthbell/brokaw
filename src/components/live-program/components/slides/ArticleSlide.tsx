import { useMemo, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';
import qrcode from 'qrcode-generator';

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  imageUrl: string;
  category?: string;
  url: string;
}

interface ArticleSlideProps {
  newsItem: NewsItem;
  progress: number;
}

const fac = new FastAverageColor();

function buildQrCodeUrl(value: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();

  let rawSvg = qr.createSvgTag(5, 0);

  // Make background transparent and foreground white so it pops on the dark parent box.
  // Leave width/height/viewBox as-is — the <img> CSS (w-32 h-32) handles scaling.
  rawSvg = rawSvg.replace(/fill="(?:#ffffff|white)"/i, 'fill="transparent"');
  rawSvg = rawSvg.replace(/fill="(?:#000000|black)"/i, 'fill="white"');

  const encodedSvg = encodeURIComponent(rawSvg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

export function ArticleSlide({ newsItem, progress }: ArticleSlideProps) {
  const [dominantColor, setDominantColor] = useState('#b21100');
  const imageUrl = newsItem.imageUrl || 'https://picsum.photos/seed/fallback/1920/1080';
  const qrCodeUrl = useMemo(() => buildQrCodeUrl(newsItem.url), [newsItem.url]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const color = fac.getColor(event.currentTarget);
      setDominantColor(color.hex);
    } catch (error) {
      console.error('Error getting average color', error);
    }
  };

  return (
    <div className='absolute inset-0'>
      <div className='absolute inset-0'>
        <img key={imageUrl} src={imageUrl} alt='' crossOrigin='anonymous' onLoad={handleImageLoad} className='w-full h-full object-cover blur-xl scale-105' />
      </div>

      <div
        className='absolute inset-0 opacity-75 mix-blend-multiply transition-all duration-1000'
        style={{ background: `linear-gradient(to bottom right, ${dominantColor}, #000000)` }}
      />

      <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_60%)]' />

      <div className='relative z-10 grid grid-cols-12 h-full'>
        <div className='col-span-5 flex flex-col justify-center p-24 relative bg-black/35 backdrop-blur-2xl'>
          <div key={newsItem.id} className='animate-slide-up flex flex-col items-start'>
            {newsItem.category && (
              <span
                className='text-white text-3xl font-bold uppercase tracking-wider mb-8 font-encode inline-block px-4 py-2'
                style={{ backgroundColor: dominantColor }}
              >
                {newsItem.category}
              </span>
            )}
            <div className='w-16 h-1.5 bg-[#b21100] mb-8' />
            <h1 className='text-5xl font-bold leading-tight mb-8 tracking-tight line-clamp-6 font-encode [text-wrap:balance]'>{newsItem.headline}</h1>
            <p className='text-4xl font-light leading-relaxed opacity-90 line-clamp-6 font-secondary'>{newsItem.summary}</p>
          </div>
        </div>

        <div className='col-span-7 relative h-full flex items-center justify-center p-16 pb-40'>
          <div className='relative w-full aspect-video shadow-2xl overflow-hidden border-4 border-white/10'>
            <div className='absolute top-0 left-0 h-1 bg-white/30 w-full z-20'>
              <div className='h-full bg-white transition-all duration-100 ease-linear' style={{ width: `${progress}%` }} />
            </div>
            <img
              key={imageUrl}
              src={imageUrl}
              alt={newsItem.headline}
              className='w-full h-full object-cover'
              style={{ animation: 'kenburns 20s infinite alternate' }}
            />

            <div className='absolute bottom-8 right-8 z-30'>
              <div className='p-2 rounded-sm backdrop-blur-md shadow-2xl' style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <img src={qrCodeUrl} alt='Article QR code' className='block w-32 h-32' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
