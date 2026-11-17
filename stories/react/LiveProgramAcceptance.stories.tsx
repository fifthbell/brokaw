import type { Meta, StoryObj } from "@storybook/html";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { expect, waitFor, within } from "storybook/test";
import LiveProgram from "../../src/components/live-program/LiveProgram";
import type {
  ProgramState,
  Scene,
} from "../../src/components/live-program/program-contract";

const PROGRAM = "acceptance-studio";
const ENDPOINT = `https://live-program-fixture.invalid/program/${PROGRAM}`;
const IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';

function metadata(city: string) {
  return {
    "fifthbell-content": {
      showArticles: false,
      showWeather: false,
      showEarthquakes: false,
      showMarkets: false,
      showLiveEvents: false,
      showCallsignTake: false,
      audioCueEnabled: false,
      languageRotation: ["en"],
    },
    "fifthbell-corner": {
      showWorldClocks: true,
      worldClockShuffle: false,
      worldClockCities: [{ city, timezone: "Etc/UTC" }],
    },
  };
}

function scene(id: number, city: string): Scene {
  return {
    id,
    name: `Studio ${id}`,
    layoutId: 1,
    layout: {
      id: 1,
      name: "Broadcast",
      componentType: "fifthbell",
      settings: "{}",
    },
    chyronText: null,
    metadata: JSON.stringify(metadata(city)),
  };
}

function snapshot(version: number, city: string): ProgramState {
  const activeScene = scene(version, city);
  return {
    id: 1,
    programId: PROGRAM,
    activeSceneId: activeScene.id,
    activeScene,
    stagedSceneId: null,
    stagedScene: null,
    updatedAt: `2026-10-25T12:00:${String(version).padStart(2, "0")}.000Z`,
    version,
  };
}

type Scenario =
  | "normal"
  | "pending-snapshot"
  | "snapshot-failure"
  | "reconnect"
  | "controlled";

/** Only the HTTP transport is substituted: the component, reconciliation and SSE hook run unchanged. */
class ProgramTransport {
  root?: Root;
  readonly requests: Array<{ url: string; init?: RequestInit }> = [];
  readonly warnings: unknown[][] = [];
  readonly errors: unknown[][] = [];
  readonly unexpected: string[] = [];
  readonly streams: ReadableStreamDefaultController<Uint8Array>[] = [];
  readonly streamSignals: AbortSignal[] = [];
  readonly interruption = new Error("fixture stream interrupted");
  snapshotCount = 0;
  cancellations = 0;
  releaseFirstSnapshot?: () => void;
  private readonly originalFetch = globalThis.fetch;
  private readonly originalWarn = console.warn;
  private readonly originalError = console.error;

  constructor(readonly scenario: Scenario) {
    console.warn = (...args: unknown[]) => {
      this.warnings.push(args);
    };
    console.error = (...args: unknown[]) => {
      this.errors.push(args);
    };
    globalThis.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      this.requests.push({ url, init });
      if (url === `${ENDPOINT}/state`) {
        this.snapshotCount += 1;
        if (scenario === "snapshot-failure")
          return new Response(null, { status: 503 });
        if (scenario === "pending-snapshot" && this.snapshotCount === 1) {
          return new Promise<Response>((resolve) => {
            this.releaseFirstSnapshot = () =>
              resolve(Response.json(snapshot(10, "OLD SNAPSHOT")));
          });
        }
        const refreshed =
          scenario === "pending-snapshot" ||
          (scenario === "reconnect" && this.snapshotCount > 2);
        return Response.json(
          snapshot(
            refreshed ? 20 : 10,
            refreshed ? "REFRESHED STUDIO" : "SNAPSHOT STUDIO",
          ),
        );
      }
      if (url === `${ENDPOINT}/events`) {
        if (init?.signal) this.streamSignals.push(init.signal);
        return new Response(
          new ReadableStream<Uint8Array>({
            start: (controller) => {
              this.streams.push(controller);
            },
            cancel: () => {
              this.cancellations += 1;
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      }
      const parsed = new URL(url, window.location.href);
      if (
        parsed.origin === "https://cdn.fifthbell.com" &&
        /^\/content\/homepage-current-(en|es|it)\.json$/.test(parsed.pathname)
      ) {
        return Response.json({
          articles: [
            {
              id: 1,
              title: "Fictional fixture story",
              excerpt: "Transport fixture, never published.",
              slug: "fictional-fixture",
              featuredImage: { url: IMAGE },
              publishedAt: new Date().toISOString(),
            },
          ],
          breakingNews: {
            main: {
              title: "Fictional live event",
              image: IMAGE,
              url: "/fixture",
            },
            updates: [],
          },
        });
      }
      if (parsed.origin === "https://api.monitor.gaulatti.com") {
        if (parsed.pathname === "/events")
          return Response.json({ events: [], total: 0 });
        if (
          ["/broadcast/weather", "/broadcast/markets", "/earthquakes"].includes(
            parsed.pathname,
          )
        )
          return Response.json([]);
      }
      this.unexpected.push(url);
      throw new Error(`Unexpected fixture request: ${url}`);
    };
  }

  send(payload: unknown) {
    this.sendRaw(`data: ${JSON.stringify(payload)}\n\n`);
  }

  sendRaw(value: string) {
    this.streams.at(-1)!.enqueue(new TextEncoder().encode(value));
  }

  diagnostic(code: string) {
    return this.warnings.some(([message]) =>
      String(message).startsWith(`[live-program:${code}]`),
    );
  }

  dispose() {
    this.root?.unmount();
    this.releaseFirstSnapshot?.();
    globalThis.fetch = this.originalFetch;
    console.warn = this.originalWarn;
    console.error = this.originalError;
  }
}

let transport: ProgramTransport;

const meta = {
  title: "React/LiveProgram acceptance",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Actual LiveProgram and SSE hook with bounded in-memory HTTP fixtures. Clock labels make accepted scene metadata observable. No external API, account, broadcast or publication is used.",
      },
    },
  },
  beforeEach: ({ args }) => {
    const current = new ProgramTransport(
      (args.scenario as Scenario) ?? "normal",
    );
    transport = current;
    return () => current.dispose();
  },
  render: (args) => {
    const container = document.createElement("div");
    container.style.height = "600px";
    transport.root = createRoot(container);
    transport.root.render(
      <LiveProgram
        programId={PROGRAM}
        apiBaseUrl={ENDPOINT}
        embedded
        {...(args.scenario === "controlled"
          ? {
              sceneMetadata: metadata("HOST STUDIO"),
              activeComponents: ["fifthbell-content"],
            }
          : {})}
      />,
    );
    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

async function ready(canvasElement: HTMLElement, label = "SNAPSHOT STUDIO") {
  await within(canvasElement).findByText(label);
  await waitFor(() => expect(transport.snapshotCount).toBe(2));
  await expect(transport.unexpected).toEqual([]);
}

export const SnapshotAndSceneTransitions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement);
    await expect(
      transport.requests
        .filter(({ url }) => url === `${ENDPOINT}/state`)
        .every(({ init }) => init?.cache === "no-store"),
    ).toBe(true);
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 11,
      scene: scene(11, "UPDATED STUDIO"),
    });
    await canvas.findByText("UPDATED STUDIO");
    await expect(canvas.queryByText("SNAPSHOT STUDIO")).toBeNull();
    transport.send({
      type: "scene_staged",
      programId: PROGRAM,
      version: 12,
      stagedSceneId: 12,
      scene: scene(12, "STAGED STUDIO"),
    });
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 12,
      scene: scene(12, "STALE STUDIO"),
    });
    await waitFor(() =>
      expect(transport.diagnostic("stale-update")).toBe(true),
    );
    await expect(canvas.getByText("UPDATED STUDIO")).toBeVisible();
    await expect(canvas.queryByText("STAGED STUDIO")).toBeNull();
    transport.send({
      type: "scene_change",
      programId: PROGRAM,
      schemaVersion: 1,
      version: 13,
      state: snapshot(13, "ON AIR STUDIO"),
    });
    await canvas.findByText("ON AIR STUDIO");
    transport.send({ type: "scene_cleared", programId: PROGRAM, version: 14 });
    await waitFor(() => expect(canvas.queryByText("ON AIR STUDIO")).toBeNull());
    await expect(transport.unexpected).toEqual([]);
    await expect(transport.errors).toEqual([]);
  },
};

export const RejectedUpdatesPreserveTheActiveScene: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement);
    for (const event of [
      {
        type: "scene_update",
        programId: PROGRAM,
        version: 9,
        scene: scene(9, "REJECTED STUDIO"),
      },
      {
        type: "scene_update",
        programId: "another-program",
        version: 11,
        scene: scene(11, "REJECTED STUDIO"),
      },
      {
        type: "scene_update",
        programId: PROGRAM,
        schemaVersion: 99,
        version: 11,
        scene: scene(11, "REJECTED STUDIO"),
      },
      {
        type: "scene_update",
        programId: PROGRAM,
        scene: scene(11, "REJECTED STUDIO"),
      },
    ])
      transport.send(event);
    transport.sendRaw("data: not-json\n\n");
    await waitFor(() => {
      for (const code of [
        "stale-update",
        "program-mismatch",
        "incompatible-schema",
        "malformed-event",
      ])
        expect(transport.diagnostic(code)).toBe(true);
      expect(
        transport.warnings.some(
          ([message]) =>
            message === "[live-program] Ignored malformed SSE JSON payload",
        ),
      ).toBe(true);
    });
    await expect(canvas.getByText("SNAPSHOT STUDIO")).toBeVisible();
    await expect(canvas.queryByText("REJECTED STUDIO")).toBeNull();
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 11,
      scene: scene(11, "RECOVERED STUDIO"),
    });
    await canvas.findByText("RECOVERED STUDIO");
    await expect(transport.unexpected).toEqual([]);
    await expect(transport.errors).toEqual([]);
  },
};

export const NewSnapshotWinsThePendingInitialRequest: Story = {
  args: { scenario: "pending-snapshot" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, "REFRESHED STUDIO");
    transport.releaseFirstSnapshot!();
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 19,
      scene: scene(19, "STALE STUDIO"),
    });
    await waitFor(() =>
      expect(transport.diagnostic("stale-update")).toBe(true),
    );
    await expect(canvas.getByText("REFRESHED STUDIO")).toBeVisible();
    await expect(canvas.queryByText("OLD SNAPSHOT")).toBeNull();
    await expect(canvas.queryByText("STALE STUDIO")).toBeNull();
    await expect(transport.errors).toEqual([]);
  },
};

export const SnapshotFailureCanRecoverFromAValidStateEvent: Story = {
  args: { scenario: "snapshot-failure" },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        transport.errors.filter(
          ([message]) =>
            message === "[live-program] Failed to fetch program snapshot:",
        ),
      ).toHaveLength(2),
    );
    for (const [, error] of transport.errors) {
      await expect(error).toBeInstanceOf(Error);
      await expect((error as Error).message).toBe(
        "Program snapshot failed: 503",
      );
    }
    transport.send({
      type: "scene_change",
      programId: PROGRAM,
      version: 11,
      state: snapshot(11, "RECOVERED STUDIO"),
    });
    await within(canvasElement).findByText("RECOVERED STUDIO");
    await expect(transport.unexpected).toEqual([]);
  },
};

export const StreamFailureRetainsStateAndReconnectsWithAFreshSnapshot: Story = {
  args: { scenario: "reconnect" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement);
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 11,
      scene: scene(11, "LAST VALID STUDIO"),
    });
    await canvas.findByText("LAST VALID STUDIO");
    transport.streams[0].error(transport.interruption);
    await waitFor(() =>
      expect(
        transport.errors.some(
          ([message, error]) =>
            message === "[SSE] error:" && error === transport.interruption,
        ),
      ).toBe(true),
    );
    await expect(canvas.getByText("LAST VALID STUDIO")).toBeVisible();
    await canvas.findByText("REFRESHED STUDIO", {}, { timeout: 4500 });
    await expect(transport.streams).toHaveLength(2);
    await expect(transport.snapshotCount).toBe(3);
    transport.send({
      type: "scene_update",
      programId: PROGRAM,
      version: 19,
      scene: scene(19, "STALE STUDIO"),
    });
    await waitFor(() =>
      expect(transport.diagnostic("stale-update")).toBe(true),
    );
    await expect(canvas.getByText("REFRESHED STUDIO")).toBeVisible();
    transport.root!.unmount();
    transport.root = undefined;
    await expect(transport.streamSignals.at(-1)?.aborted).toBe(true);
    await expect(transport.cancellations).toBe(1);
    await expect(transport.unexpected).toEqual([]);
    await expect(transport.errors).toEqual([
      ["[SSE] error:", transport.interruption],
    ]);
  },
};

export const SceneRendererOwnsMetadataWithoutAProgramSubscription: Story = {
  args: { scenario: "controlled" },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("HOST STUDIO");
    await expect(
      transport.requests.filter(({ url }) => url.startsWith(ENDPOINT)),
    ).toEqual([]);
    await expect(transport.streams).toEqual([]);
    await expect(transport.unexpected).toEqual([]);
    await expect(transport.errors).toEqual([]);
  },
};
