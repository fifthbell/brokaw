export const LIVE_PROGRAM_SCHEMA_VERSION = 1;

export interface Layout {
  id: number;
  name: string;
  componentType: string;
  settings: string;
}

export interface Scene {
  id: number;
  name: string;
  layoutId: number;
  layout: Layout;
  chyronText: string | null;
  metadata: string | null;
}

export interface ProgramState {
  id: number;
  programId?: string;
  activeSceneId: number | null;
  activeScene: Scene | null;
  stagedSceneId?: number | null;
  stagedScene?: Scene | null;
  updatedAt: string;
  version: number;
}

export interface ProgramEvent extends Record<string, unknown> {
  type: string;
  programId?: string;
  schemaVersion?: number;
  version?: number;
}

export type ProgramDiagnostic = {
  code:
    | 'incompatible-schema'
    | 'malformed-event'
    | 'malformed-snapshot'
    | 'program-mismatch'
    | 'stale-update';
  message: string;
  payload?: unknown;
};

export type ProgramStateResult = {
  state: ProgramState | null;
  accepted: boolean;
  diagnostic?: ProgramDiagnostic;
};

const STATE_EVENT_TYPES = new Set([
  'scene_change',
  'scene_staged',
  'scene_update',
  'scene_cleared',
  'program_scenes_changed',
  'program_media_groups_changed',
  'program_stingers_changed',
]);

export function isProgramStateEvent(event: ProgramEvent): boolean {
  return STATE_EVENT_TYPES.has(event.type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value) || !isRecord(value.layout)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.layoutId === 'number' &&
    typeof value.layout.id === 'number' &&
    typeof value.layout.name === 'string' &&
    typeof value.layout.componentType === 'string' &&
    typeof value.layout.settings === 'string' &&
    (value.chyronText === null || typeof value.chyronText === 'string') &&
    (value.metadata === null || typeof value.metadata === 'string')
  );
}

function schemaDiagnostic(payload: Record<string, unknown>): ProgramDiagnostic | undefined {
  if (payload.schemaVersion === undefined || payload.schemaVersion === LIVE_PROGRAM_SCHEMA_VERSION) {
    return undefined;
  }
  return {
    code: 'incompatible-schema',
    message: `Expected live-program schema ${LIVE_PROGRAM_SCHEMA_VERSION}, received ${String(payload.schemaVersion)}`,
    payload,
  };
}

export function resolveProgramEndpoint(apiBaseUrl: string | undefined, programId: string): string {
  const normalizedProgramId = programId.trim() || 'fifthbell';
  const fallback = (() => {
    if (typeof window === 'undefined') return 'http://127.0.0.1:3000';
    const hostname = window.location.hostname;
    return `http://${hostname.includes(':') ? `[${hostname}]` : hostname}:3000`;
  })();
  const base = (apiBaseUrl?.trim() || fallback).replace(/\/+$/, '');
  const encodedProgramId = encodeURIComponent(normalizedProgramId);

  if (/\/program\/[^/]+$/.test(base)) return base;
  if (base.endsWith('/program')) return `${base}/${encodedProgramId}`;
  return `${base}/program/${encodedProgramId}`;
}

export function parseProgramSnapshot(payload: unknown, expectedProgramId: string): ProgramStateResult {
  if (!isRecord(payload)) {
    return { state: null, accepted: false, diagnostic: { code: 'malformed-snapshot', message: 'Program snapshot must be an object', payload } };
  }
  const incompatible = schemaDiagnostic(payload);
  if (incompatible) return { state: null, accepted: false, diagnostic: incompatible };
  if (typeof payload.programId === 'string' && payload.programId !== expectedProgramId) {
    return { state: null, accepted: false, diagnostic: { code: 'program-mismatch', message: `Expected program ${expectedProgramId}, received ${payload.programId}`, payload } };
  }
  if (
    typeof payload.id !== 'number' ||
    !isVersion(payload.version) ||
    typeof payload.updatedAt !== 'string' ||
    !(payload.activeSceneId === null || typeof payload.activeSceneId === 'number') ||
    !(payload.activeScene === null || isScene(payload.activeScene)) ||
    !(payload.stagedScene === undefined || payload.stagedScene === null || isScene(payload.stagedScene))
  ) {
    return { state: null, accepted: false, diagnostic: { code: 'malformed-snapshot', message: 'Program snapshot is missing required state fields or a valid version', payload } };
  }
  return { state: payload as unknown as ProgramState, accepted: true };
}

export function parseProgramEvent(payload: unknown, expectedProgramId: string): { event: ProgramEvent | null; diagnostic?: ProgramDiagnostic } {
  if (!isRecord(payload) || typeof payload.type !== 'string' || !payload.type.trim()) {
    return { event: null, diagnostic: { code: 'malformed-event', message: 'Program event must contain a non-empty type', payload } };
  }
  const incompatible = schemaDiagnostic(payload);
  if (incompatible) return { event: null, diagnostic: incompatible };
  if (typeof payload.programId === 'string' && payload.programId !== expectedProgramId) {
    return { event: null, diagnostic: { code: 'program-mismatch', message: `Expected program ${expectedProgramId}, received ${payload.programId}`, payload } };
  }
  if (STATE_EVENT_TYPES.has(payload.type) && !isVersion(payload.version)) {
    return { event: null, diagnostic: { code: 'malformed-event', message: `State event ${payload.type} requires a non-negative integer version`, payload } };
  }
  return { event: payload as ProgramEvent };
}

export function reconcileProgramSnapshot(current: ProgramState | null, payload: unknown, expectedProgramId: string): ProgramStateResult {
  const parsed = parseProgramSnapshot(payload, expectedProgramId);
  if (!parsed.accepted || !parsed.state) return parsed;
  if (current && parsed.state.version === current.version) {
    return { state: current, accepted: false, diagnostic: { code: 'stale-update', message: `Ignored snapshot version ${parsed.state.version}; current version is ${current.version}`, payload } };
  }
  if (current && parsed.state.version < current.version) {
    const currentUpdatedAt = Date.parse(current.updatedAt);
    const candidateUpdatedAt = Date.parse(parsed.state.updatedAt);
    if (!Number.isFinite(candidateUpdatedAt) || candidateUpdatedAt < currentUpdatedAt) {
      return { state: current, accepted: false, diagnostic: { code: 'stale-update', message: `Ignored snapshot version ${parsed.state.version}; current version is ${current.version}`, payload } };
    }
  }
  return parsed;
}

export function reconcileProgramEvent(current: ProgramState | null, event: ProgramEvent): ProgramStateResult {
  if (!STATE_EVENT_TYPES.has(event.type)) return { state: current, accepted: true };
  const version = event.version as number;
  if (current && version <= current.version) {
    return { state: current, accepted: false, diagnostic: { code: 'stale-update', message: `Ignored ${event.type} version ${version}; current version is ${current.version}`, payload: event } };
  }
  if ((event.type === 'scene_change' || event.type === 'program_scenes_changed' || event.type === 'program_media_groups_changed' || event.type === 'program_stingers_changed') && isRecord(event.state)) {
    const next: Record<string, unknown> = { ...event.state, version };
    const parsed = parseProgramSnapshot(next, event.programId ?? current?.programId ?? String(next.programId ?? ''));
    if (parsed.accepted) return parsed;
    return parsed;
  }
  if (!current) {
    return { state: null, accepted: false, diagnostic: { code: 'malformed-event', message: `Cannot apply ${event.type} before a valid snapshot`, payload: event } };
  }
  if (event.type === 'scene_staged') {
    if (!(event.scene === null || isScene(event.scene))) {
      return { state: current, accepted: false, diagnostic: { code: 'malformed-event', message: 'scene_staged contains an invalid scene', payload: event } };
    }
    return { state: { ...current, stagedSceneId: typeof event.stagedSceneId === 'number' ? event.stagedSceneId : null, stagedScene: event.scene ?? null, version }, accepted: true };
  }
  if (event.type === 'scene_update' && isScene(event.scene)) {
    return { state: { ...current, activeScene: event.scene, version }, accepted: true };
  }
  if (event.type === 'scene_cleared') {
    return { state: { ...current, activeSceneId: null, activeScene: null, version }, accepted: true };
  }
  return { state: current, accepted: false, diagnostic: { code: 'malformed-event', message: `State event ${event.type} does not contain the required payload`, payload: event } };
}
