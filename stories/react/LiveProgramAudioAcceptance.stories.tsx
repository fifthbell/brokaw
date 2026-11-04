import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, waitFor, within } from 'storybook/test';
import LiveProgram from '../../src/components/live-program/LiveProgram';
import type { ProgramState } from '../../src/components/live-program/program-contract';

const PROGRAM = 'audio-acceptance';
const ENDPOINT = `https://audio-fixture.invalid/program/${PROGRAM}`;

function snapshot(cueAt: Date | null): ProgramState {
  return {
    id: 1,
    programId: PROGRAM,
    activeSceneId: 1,
    activeScene: {
      id: 1,
      name: 'Audio fixture',
      layoutId: 1,
      layout: { id: 1, name: 'Broadcast', componentType: 'fifthbell', settings: '{}' },
      chyronText: null,
      metadata: JSON.stringify({
        'fifthbell-content': {
          showArticles: false,
          showWeather: false,
          showEarthquakes: false,
          showMarkets: false,
          showLiveEvents: false,
          showCallsignTake: false,
          audioCueEnabled: cueAt !== null,
          ...(cueAt ? { audioCueMinute: cueAt.getMinutes(), audioCueSecond: cueAt.getSeconds() } : {}),
          languageRotation: ['en'],
        },
        'fifthbell-corner': {
          showWorldClocks: true,
          worldClockShuffle: false,
          worldClockCities: [{ city: 'AUDIO FIXTURE', timezone: 'Etc/UTC' }],
        },
      }),
    },
    updatedAt: '2026-10-25T12:00:00.000Z',
    version: 1,
  };
}

/** A real, bounded PCM WAV. Native decoding/playback is never replaced by a resolved play promise. */
function wavUrl(seconds = 12): string {
  const rate = 8000;
  const frames = rate * seconds;
  const buffer = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + frames * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i += 1) {
    view.setInt16(44 + i * 2, Math.round(Math.sin((i / rate) * Math.PI * 440) * 4096), true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

/** Only HTTP is substituted. The Audio proxy observes, and delegates to, the real browser constructor. */
class AudioFixture {
  root?: Root;
  readonly players: HTMLAudioElement[] = [];
  readonly urls = [wavUrl(), wavUrl()];
  readonly streams: ReadableStreamDefaultController<Uint8Array>[] = [];
  readonly signals: AbortSignal[] = [];
  readonly errors: unknown[][] = [];
  readonly unexpected: string[] = [];
  readonly pendingSources: MediaSource[] = [];
  snapshots = 0;
  cancellations = 0;
  private readonly originalFetch = globalThis.fetch;
  private readonly originalAudio = globalThis.Audio;
  private readonly originalError = console.error;

  constructor(cue = false) {
    const cueAt = cue ? new Date(Date.now() + 4000) : null;
    const owner = this;
    globalThis.Audio = new Proxy(this.originalAudio, {
      construct(target, args) {
        const audio = Reflect.construct(target, args) as HTMLAudioElement;
        owner.players.push(audio);
        return audio;
      },
    });
    console.error = (...args: unknown[]) => { this.errors.push(args); };
    globalThis.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url === `${ENDPOINT}/state`) {
        this.snapshots += 1;
        return Response.json(snapshot(cueAt));
      }
      if (url === `${ENDPOINT}/events`) {
        if (init?.signal) this.signals.push(init.signal);
        return new Response(new ReadableStream<Uint8Array>({
          start: (controller) => { this.streams.push(controller); },
          cancel: () => { this.cancellations += 1; },
        }), { headers: { 'Content-Type': 'text/event-stream' } });
      }
      const parsed = new URL(url, window.location.href);
      if (parsed.origin === `http://${window.location.hostname}:3000` && parsed.pathname === '/events') {
        return Response.json({ data: [] });
      }
      if (parsed.origin === 'https://cdn.fifthbell.com' && /^\/content\/homepage-current-(en|es|it)\.json$/.test(parsed.pathname)) {
        return Response.json({ articles: [], breakingNews: { updates: [] } });
      }
      if (parsed.origin === 'https://api.monitor.gaulatti.com') {
        if (parsed.pathname === '/events') return Response.json({ events: [], total: 0 });
        if (['/broadcast/weather', '/broadcast/markets', '/earthquakes'].includes(parsed.pathname)) return Response.json([]);
      }
      this.unexpected.push(url);
      throw new Error(`Unexpected audio fixture request: ${url}`);
    };
  }

  send(event: Record<string, unknown>) {
    this.streams.at(-1)!.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
      schemaVersion: 1, programId: PROGRAM, ...event,
    })}\n\n`));
  }

  bus(mixerSettings: Record<string, unknown>, songSequence?: Record<string, unknown>) {
    this.send({ type: 'audio_bus_update', settings: { mixerSettings, ...(songSequence ? { songSequence } : {}) } });
  }

  instant(type: 'instant_play' | 'scene_instant_take', index = 0, volume = 1, loop?: boolean) {
    this.send({ type, instant: { id: index + 1, name: `Fixture ${index + 1}`, audioUrl: this.urls[index], volume }, ...(loop === undefined ? {} : { loop }) });
  }

  pendingSceneStream() {
    // A native streaming resource waiting for its first segment, never reported as decoded/playing.
    const source = new MediaSource();
    this.pendingSources.push(source);
    this.urls.push(URL.createObjectURL(source));
    return this.urls.length - 1;
  }

  unmount() {
    this.root?.unmount();
    this.root = undefined;
  }

  dispose() {
    this.unmount();
    // Fixture safety only: these calls do not claim component unmount stopped audio.
    for (const audio of this.players) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    for (const url of this.urls) URL.revokeObjectURL(url);
    globalThis.fetch = this.originalFetch;
    globalThis.Audio = this.originalAudio;
    console.error = this.originalError;
  }
}

let fixture: AudioFixture;

const meta = {
  title: 'React/LiveProgram audio acceptance',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Actual LiveProgram, SSE hook and browser audio driven by public program events. Valid generated PCM WAVs exercise decoding and transport controls. Click Enable browser audio fixture in an interactive preview; browser tests use a real native pointer click under the unchanged autoplay policy. Native observations establish browser behavior, not physical audio output. Fixture teardown releases media separately from component cleanup.',
      },
    },
  },
  beforeEach: ({ args }) => {
    const current = new AudioFixture(args.cue === true);
    fixture = current;
    return () => current.dispose();
  },
  render: () => {
    const container = document.createElement('div');
    const activate = document.createElement('button');
    activate.type = 'button';
    activate.textContent = 'Enable browser audio fixture';
    container.append(activate);
    const stage = document.createElement('div');
    stage.style.height = '600px';
    container.append(stage);
    fixture.root = createRoot(stage);
    fixture.root.render(<LiveProgram programId={PROGRAM} apiBaseUrl={ENDPOINT} embedded />);
    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

async function ready(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByText('AUDIO FIXTURE');
  await waitFor(() => expect(fixture.snapshots).toBe(2));
  await expect(fixture.unexpected).toEqual([]);
  const button = canvas.getByRole('button', { name: 'Enable browser audio fixture' });
  if (import.meta.env.MODE === 'test') {
    // Native Playwright input grants ordinary user activation; playback policy stays unchanged.
    const { userEvent: browserInput } = await import('vitest/browser');
    await browserInput.click(button);
  } else {
    await new Promise<void>((resolve) => button.addEventListener('click', () => resolve(), { once: true }));
  }
}

async function playing(index: number, duration = 12) {
  await waitFor(() => {
    const audio = fixture.players[index];
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    expect(audio.error).toBeNull();
    expect(audio.readyState).toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_CURRENT_DATA);
    expect(audio.paused, fixture.errors.map((args) => args.map(String).join(' ')).join('\n')).toBe(false);
    expect(audio.currentTime).toBeGreaterThan(0);
    expect(audio.duration).toBeCloseTo(duration, 1);
  });
  return fixture.players[index];
}

export const InstantMixerMuteAndStop: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.bus({ instantMasterVolume: 0.4 });
    fixture.instant('instant_play');
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.4);
    await expect(audio.loop).toBe(false);
    fixture.bus({ instantMasterVolume: 0.6, instantMuted: true });
    await waitFor(() => expect(audio.volume).toBe(0));
    fixture.bus({ instantMasterVolume: 0.3, instantMuted: false });
    await waitFor(() => expect(audio.volume).toBeCloseTo(0.3));
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => {
      expect(audio.paused).toBe(true);
      expect(audio.currentTime).toBe(0);
      expect(audio.onended).toBeNull();
      expect(audio.onerror).toBeNull();
    });
    fixture.bus({ instantMasterVolume: 0.9 });
    await new Promise((resolve) => setTimeout(resolve, 30));
    await expect(audio.volume).toBeCloseTo(0.3);
    await expect(fixture.players).toHaveLength(1);
  },
};

export const SceneVolumeAndFadeStop: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.bus({ sceneInstantMasterVolume: 0.5 });
    fixture.instant('scene_instant_take', 0, 0.6, false);
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.3);
    await expect(audio.loop).toBe(false);
    fixture.send({ type: 'scene_instant_stop', fadeMs: 80 });
    await waitFor(() => {
      expect(audio.volume).toBe(0);
      expect(audio.paused).toBe(true);
      expect(audio.currentTime).toBe(0);
      expect(audio.onended).toBeNull();
      expect(audio.onerror).toBeNull();
    });
    fixture.send({ type: 'scene_instant_stop' });
    fixture.instant('scene_instant_take', 1);
    const replacement = await playing(1);
    await expect(replacement.loop).toBe(true);
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => expect(replacement.paused).toBe(true));
  },
};

export const LatestSceneTakeWinsDuringCrossfade: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take', 0);
    const original = await playing(0);
    fixture.instant('scene_instant_take', 1);
    fixture.instant('scene_instant_take', 0, 0.7, false);
    await waitFor(() => expect(fixture.players).toHaveLength(2), { timeout: 3000 });
    const replacement = await playing(1);
    await expect(original.paused).toBe(true);
    await expect(replacement.src).toBe(fixture.urls[0]);
    await expect(replacement.volume).toBeCloseTo(0.7);
    await expect(replacement.loop).toBe(false);
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => expect(replacement.paused).toBe(true));
  },
};

export const SongReplacementAndOffAir: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const sequence = (index: number, loop = true) => ({
      items: fixture.urls.map((audioUrl, i) => ({ id: i + 1, audioUrl })),
      activeItemId: index + 1,
      loop,
    });
    fixture.bus({ songMasterVolume: 0.65 }, sequence(0, false));
    const original = await playing(0);
    await expect(original.volume).toBeCloseTo(0.65);
    await expect(original.loop).toBe(false);
    fixture.bus({ songMasterVolume: 0.4, songMuted: true }, sequence(1));
    const replacement = await playing(1);
    await expect(original.paused).toBe(true);
    await expect(original.onerror).toBeNull();
    await expect(replacement.volume).toBe(0);
    await expect(replacement.loop).toBe(true);
    fixture.send({ type: 'song_off_air' });
    await waitFor(() => {
      expect(replacement.paused).toBe(true);
      expect(replacement.onerror).toBeNull();
    });
    fixture.send({ type: 'song_off_air' });
    fixture.bus({ songMasterVolume: 0.2 }, sequence(0));
    const resumed = await playing(2);
    fixture.bus({});
    await waitFor(() => expect(resumed.paused).toBe(true));
  },
};

export const StreamRecoveryAndCancellation: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take', 0, 0.5);
    const audio = await playing(0);
    fixture.streams[0].error(new Error('bounded fixture stream interruption'));
    await waitFor(() => expect(fixture.errors.some(([message]) => String(message) === '[SSE] error:')).toBe(true));
    await waitFor(() => expect(fixture.streams).toHaveLength(2), { timeout: 4500 });
    await waitFor(() => expect(fixture.snapshots).toBe(3));
    fixture.send({ type: 'scene_instant_state', playback: {
      isPlaying: true,
      instant: { id: 1, name: 'Fixture 1', audioUrl: fixture.urls[0], volume: 0.5 },
    } });
    await new Promise((resolve) => setTimeout(resolve, 80));
    await expect(fixture.players).toHaveLength(1);
    await expect(audio.paused).toBe(false);
    fixture.send({ type: 'scene_instant_stop' });
    await waitFor(() => expect(audio.paused).toBe(true));
    fixture.unmount();
    await waitFor(() => {
      expect(fixture.cancellations).toBe(1);
      expect(fixture.signals.at(-1)!.aborted).toBe(true);
    });
    await new Promise((resolve) => setTimeout(resolve, 3200));
    await expect(fixture.streams).toHaveLength(2);
    await expect(fixture.unexpected).toEqual([]);
  },
};

export const BaseGainSurvivesBusUpdate: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.bus({ instantMasterVolume: 0.4 });
    fixture.instant('instant_play', 0, 0.5);
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.2);
    fixture.bus({ instantMasterVolume: 0.6 });
    await waitFor(() => expect(audio.volume).toBeCloseTo(0.3));
  },
};

export const CurrentSongHonorsMute: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const sequence = { items: [{ id: 1, audioUrl: fixture.urls[0] }], activeItemId: 1, loop: true };
    fixture.bus({ songMasterVolume: 0.7 }, sequence);
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.7);
    fixture.bus({ songMasterVolume: 0.2, songMuted: true }, sequence);
    await waitFor(() => expect(audio.volume).toBe(0));
  },
};

export const SceneBaseGainSurvivesBusUpdate: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.bus({ sceneInstantMasterVolume: 0.4 });
    fixture.instant('scene_instant_take', 0, 0.5);
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.2);
    fixture.bus({ sceneInstantMasterVolume: 0.6 });
    await waitFor(() => expect(audio.volume).toBeCloseTo(0.3));
  },
};

export const UnmountStopsActiveMedia: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('instant_play');
    await playing(0);
    fixture.instant('scene_instant_take');
    await playing(1);
    fixture.bus({}, { items: [{ id: 1, audioUrl: fixture.urls[1] }], activeItemId: 1, loop: true });
    await playing(2);
    fixture.unmount();
    await waitFor(() => expect(fixture.cancellations).toBe(1));
    await waitFor(() => expect(fixture.players.map((audio) => audio.paused)).toEqual([true, true, true]));
  },
};

export const UnmountCancelsPendingSceneTake: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take');
    const original = await playing(0);
    fixture.instant('scene_instant_take', 1);
    // Let the real SSE reader process the take; the native crossfade lasts 1500 ms.
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.unmount();
    await new Promise((resolve) => setTimeout(resolve, 1700));
    await expect(fixture.players).toHaveLength(1);
    await expect(original.paused).toBe(true);
    await expect(fixture.cancellations).toBe(1);
  },
};

export const CancelledLoadCannotEraseNewSceneOwner: Story = {
  play: async ({ canvasElement, args }) => {
    await ready(canvasElement);
    const pending = fixture.pendingSceneStream();
    if (args.restoreScene) {
      fixture.send({ type: 'scene_instant_state', playback: {
        isPlaying: true,
        instant: { id: 3, name: 'Pending fixture stream', audioUrl: fixture.urls[pending], volume: 1 },
      } });
    } else {
      fixture.instant('scene_instant_take', pending);
    }
    await waitFor(() => {
      expect(fixture.players).toHaveLength(1);
      expect(fixture.players[0].paused).toBe(false);
      expect(fixture.players[0].readyState).toBe(HTMLMediaElement.HAVE_NOTHING);
    }, { timeout: 3000 });
    fixture.instant('scene_instant_take', 1);
    await waitFor(() => expect(fixture.players).toHaveLength(2), { timeout: 3000 });
    const replacement = await playing(1);
    await waitFor(() => expect(fixture.players[0].paused).toBe(true));
    await expect(fixture.errors.some((args) => args.some((value) => String(value).includes('AbortError')))).toBe(true);
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => expect(replacement.paused).toBe(true));
  },
};

export const CancelledRestoreCannotEraseNewSceneOwner: Story = {
  ...CancelledLoadCannotEraseNewSceneOwner,
  args: { restoreScene: true },
};

export const UnmountStopsScheduledCue: Story = {
  args: { cue: true },
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const cue = canvasElement.querySelector('audio')!;
    await waitFor(() => {
      expect(cue.error).toBeNull();
      expect(cue.paused).toBe(false);
      expect(cue.readyState).toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_CURRENT_DATA);
      expect(cue.currentTime).toBeGreaterThan(0);
    }, { timeout: 6500 });
    fixture.unmount();
    await waitFor(() => expect(cue.paused).toBe(true));
  },
};

export const NaturalSceneEndReleasesItsOwner: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.urls.push(wavUrl(1));
    fixture.instant('scene_instant_take', 2, 1, false);
    const finished = await playing(0, 1);
    await waitFor(() => expect(finished.ended).toBe(true), { timeout: 2000 });
    fixture.instant('scene_instant_take', 1);
    const next = await playing(1);
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => expect(next.paused).toBe(true));
  },
};

export const NativeSceneFailureAllowsTheNextTake: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const unavailable = wavUrl();
    URL.revokeObjectURL(unavailable);
    fixture.urls.push(unavailable);
    fixture.instant('scene_instant_take', 2);
    await waitFor(() => {
      expect(fixture.players).toHaveLength(1);
      expect(fixture.players[0].error).not.toBeNull();
    });
    // Only the replacement, with a valid resource, is asserted to decode and play.
    fixture.instant('scene_instant_take', 1);
    const next = await playing(1);
    fixture.send({ type: 'instant_stop_all' });
    await waitFor(() => expect(next.paused).toBe(true));
  },
};

function restore(url: string) {
  fixture.send({ type: 'scene_instant_state', playback: {
    isPlaying: true,
    instant: { id: 9, name: 'Restored fixture', audioUrl: url, volume: 1 },
  } });
}

/** A later independent instant proves the SSE reader has processed every earlier event. */
async function settle(index: number) {
  const before = fixture.players.length;
  fixture.instant('instant_play', 0);
  await waitFor(() => expect(fixture.players).toHaveLength(before + 1));
  await playing(index);
}

export const SceneMutedBusSilencesCurrentTake: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take', 0, 0.8);
    const audio = await playing(0);
    await expect(audio.volume).toBeCloseTo(0.8);
    fixture.bus({ sceneInstantMuted: true });
    await waitFor(() => expect(audio.volume).toBe(0));
  },
};

export const StaleSceneCallbacksCannotClearTheNewOwner: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take', 0);
    const first = await playing(0);
    const staleEnded = first.onended!;
    const staleError = first.onerror!;
    fixture.send({ type: 'scene_instant_stop' });
    await waitFor(() => expect(first.paused).toBe(true));
    fixture.instant('scene_instant_take', 1);
    const second = await playing(1);
    fixture.bus({ sceneInstantMasterVolume: 0.5 });
    await waitFor(() => expect(second.volume).toBeCloseTo(0.5));
    // The old owner's retained callbacks are invoked directly: natural end/error timing cannot be forced after release.
    staleEnded.call(first, new Event('ended'));
    staleError.call(first, new Event('error'));
    fixture.bus({ sceneInstantMasterVolume: 0.25 });
    await waitFor(() => expect(second.volume).toBeCloseTo(0.25));
    await expect(second.paused).toBe(false);
  },
};

export const InterruptedSceneTakeReleasesItsOwner: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    fixture.instant('scene_instant_take', fixture.pendingSceneStream());
    await waitFor(() => {
      expect(fixture.players).toHaveLength(1);
      expect(fixture.players[0].paused).toBe(false);
    });
    const interrupted = fixture.players[0];
    interrupted.pause();
    await waitFor(() => expect(fixture.errors.some((args) => args.some((value) => String(value).includes('play failed')))).toBe(true));
    interrupted.volume = 0.9;
    fixture.bus({ sceneInstantMasterVolume: 0.3 });
    await settle(1);
    await expect(interrupted.volume).toBeCloseTo(0.9);
  },
};

export const RestoredSceneCallbacksFollowTheirOwner: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    restore(fixture.urls[0]);
    await waitFor(() => expect(fixture.players).toHaveLength(1), { timeout: 4000 });
    const first = await playing(0);
    const staleEnded = first.onended!;
    const staleError = first.onerror!;
    // The first owner ends and releases its claim; a later restore becomes the owner.
    first.dispatchEvent(new Event('ended'));
    fixture.bus({ sceneInstantMasterVolume: 0.5 });
    await settle(1);
    await expect(first.volume).toBe(1);
    restore(fixture.urls[1]);
    await waitFor(() => expect(fixture.players).toHaveLength(3), { timeout: 4000 });
    const second = await playing(2);
    fixture.bus({ sceneInstantMasterVolume: 0.5 });
    await waitFor(() => expect(second.volume).toBeCloseTo(0.5));
    staleEnded.call(first, new Event('ended'));
    staleError.call(first, new Event('error'));
    fixture.bus({ sceneInstantMasterVolume: 0.25 });
    await waitFor(() => expect(second.volume).toBeCloseTo(0.25));
    // The owner's own failure releases it.
    second.dispatchEvent(new Event('error'));
    fixture.bus({ sceneInstantMasterVolume: 0.75 });
    await settle(3);
    await expect(second.volume).toBeCloseTo(0.25);
  },
};

export const InterruptedRestoredSceneReleasesItsOwner: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    restore(fixture.urls[fixture.pendingSceneStream()]);
    await waitFor(() => {
      expect(fixture.players).toHaveLength(1);
      expect(fixture.players[0].paused).toBe(false);
    }, { timeout: 4000 });
    const interrupted = fixture.players[0];
    interrupted.pause();
    await waitFor(() => expect(fixture.errors.some((args) => args.some((value) => String(value).includes('play failed')))).toBe(true));
    interrupted.volume = 0.9;
    fixture.bus({ sceneInstantMasterVolume: 0.3 });
    await settle(1);
    await expect(interrupted.volume).toBeCloseTo(0.9);
  },
};
