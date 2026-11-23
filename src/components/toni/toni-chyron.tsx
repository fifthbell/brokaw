import React from 'react';

const LABELS = ['EN VIVO', 'LIVE'];
const LABEL_INTERVAL_MS = 4000;
const LABEL_FADE_MS = 350;
export const DEFAULT_TONI_SOCIAL_HANDLES = ['@modoitaliano.oficial', '@fifth.bell', '@hnmages'];
const SOCIAL_INTERVAL_MS = 4000;

export interface FifthBellChyronProps {
  /** The text to show now. The host resolves any sequence before passing it in. */
  text?: string;
  show?: boolean;
  /** Scroll the text as a marquee. The host decides this from the resolved content. */
  useMarquee?: boolean;
  /** A fixed slug label; when omitted the slug cycles EN VIVO and LIVE. */
  label?: string;
  /** The social handles to cycle; the Fifth Bell handles when omitted. */
  socialHandles?: string[];
}

function normalizeSocialHandles(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_TONI_SOCIAL_HANDLES;
  }
  return value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

export const FifthBellChyron: React.FC<FifthBellChyronProps> = ({
  text = '',
  show = false,
  useMarquee = false,
  label,
  socialHandles: socialHandlesProp
}) => {
  const [visible, setVisible] = React.useState(show);
  const socialHandles = React.useMemo(() => normalizeSocialHandles(socialHandlesProp), [socialHandlesProp]);
  const [displayText, setDisplayText] = React.useState(text);
  const [isChanging, setIsChanging] = React.useState(false);
  const [labelIndex, setLabelIndex] = React.useState(0);
  const [labelFading, setLabelFading] = React.useState(false);
  const labelIndexRef = React.useRef(0);
  const [socialIndex, setSocialIndex] = React.useState(0);
  const socialIndexRef = React.useRef(0);

  React.useEffect(() => {
    setVisible(show);
  }, [show]);

  React.useEffect(() => {
    if (text !== displayText) {
      setIsChanging(true);
      const timer = setTimeout(() => {
        setDisplayText(text);
        setIsChanging(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [text, displayText]);

  // Cycle the slug label only when no label is forced.
  React.useEffect(() => {
    if (label) return;
    const timer = setInterval(() => {
      setLabelFading(true);
      setTimeout(() => {
        const next = (labelIndexRef.current + 1) % LABELS.length;
        labelIndexRef.current = next;
        setLabelIndex(next);
        setLabelFading(false);
      }, LABEL_FADE_MS);
    }, LABEL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle the social handles.
  React.useEffect(() => {
    setSocialIndex(0);
    socialIndexRef.current = 0;

    if (socialHandles.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      const next = (socialIndexRef.current + 1) % socialHandles.length;
      socialIndexRef.current = next;
      setSocialIndex(next);
    }, SOCIAL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [socialHandles]);

  if (!visible || !text) {
    return null;
  }

  const activeLabel = label ?? LABELS[labelIndex];

  return (
    <div className='toni-chyron toni-chyron-visible'>
      <div className='toni-chyron-slug'>
        <span className={`toni-chyron-slug-text${labelFading ? ' toni-chyron-slug-text--fading' : ''}`}>{activeLabel}</span>
      </div>
      <div className='toni-chyron-divider' aria-hidden='true' />
      <div className='toni-chyron-content'>
        <div className={`toni-chyron-text ${isChanging ? 'is-changing' : ''} ${useMarquee ? 'marquee' : ''}`}>{displayText}</div>
        {socialHandles.length > 0 ? (
          <div className='toni-chyron-social-stack'>
            {socialHandles.map((handle, i) => (
              <div key={`${handle}-${i}`} className={`toni-chyron-social${i === socialIndex ? ' toni-chyron-social--active' : ''}`}>
                {handle}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** The name the Fifth Bell chyron had before the rebrand; kept so existing references resolve. */
export const ToniChyron = FifthBellChyron;
