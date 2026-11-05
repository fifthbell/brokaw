import { describe, expect, it } from 'vitest';
import {
  LIVE_PROGRAM_SCHEMA_VERSION,
  isProgramStateEvent,
  parseProgramEvent,
  parseProgramSnapshot,
  reconcileProgramEvent,
  reconcileProgramSnapshot,
  resolveProgramEndpoint,
} from './program-contract.js';

const PROGRAM = 'fifthbell';
const STATE_TYPES = [
  'scene_change', 'scene_staged', 'scene_update', 'scene_cleared',
  'program_scenes_changed', 'program_media_groups_changed', 'program_stingers_changed',
];
const REPLACEMENT_TYPES = [
  'scene_change', 'program_scenes_changed', 'program_media_groups_changed', 'program_stingers_changed',
];
type JsonObject = Record<string, unknown>;
const wire = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function scene() {
  return {
    id: 7, name: 'Headlines', layoutId: 2,
    layout: { id: 2, name: 'News', componentType: 'articles', settings: '{}' },
    chyronText: null, metadata: null,
  };
}

function snapshot(version = 4, updatedAt = '2026-10-25T12:00:00.000Z'): JsonObject {
  return wire({
    id: 1, programId: PROGRAM, schemaVersion: LIVE_PROGRAM_SCHEMA_VERSION,
    activeSceneId: 7, activeScene: scene(), stagedSceneId: null, stagedScene: null,
    version, updatedAt,
  });
}

function currentState() {
  const parsed = parseProgramSnapshot(snapshot(), PROGRAM);
  expect(parsed.accepted).toBe(true);
  if (!parsed.state) throw new Error('Canonical fixture must pass the public snapshot boundary');
  return parsed.state;
}

function admittedEvent(payload: JsonObject) {
  const parsed = parseProgramEvent(payload, PROGRAM);
  expect(parsed.diagnostic).toBeUndefined();
  expect(parsed.event).toBe(payload);
  if (!parsed.event) throw new Error('Canonical fixture must pass the public event boundary');
  return parsed.event;
}

describe('program contract accepts canonical wire values', () => {
  it.each([0, 1, Number.MAX_SAFE_INTEGER])('preserves snapshot identity at valid version %s', (version) => {
    const payload = snapshot(version);
    const before = wire(payload);
    const result = parseProgramSnapshot(payload, PROGRAM);
    expect(result).toEqual({ accepted: true, state: payload });
    expect(result.state).toBe(payload);
    expect(payload).toEqual(before);
  });

  it.each(['null-scenes', 'optional-stage-omitted', 'text-metadata'])('accepts canonical optional scene form %s', (form) => {
    const payload = snapshot();
    if (form === 'null-scenes') {
      payload.activeSceneId = null;
      payload.activeScene = null;
    } else if (form === 'optional-stage-omitted') {
      delete payload.stagedScene;
      delete payload.stagedSceneId;
    } else {
      payload.activeScene = { ...scene(), chyronText: 'Evening headlines', metadata: '{"language":"en"}' };
      payload.stagedScene = scene();
      payload.stagedSceneId = 7;
    }
    expect(parseProgramSnapshot(payload, PROGRAM).state).toBe(payload);
    expect(parseProgramSnapshot(payload, PROGRAM).diagnostic).toBeUndefined();
  });

  it('retains the documented v1 compatibility when schemaVersion is absent', () => {
    const payload = snapshot();
    delete payload.schemaVersion;
    expect(parseProgramSnapshot(payload, PROGRAM)).toEqual({ accepted: true, state: payload });
    const event = wire({ type: 'scene_cleared', programId: PROGRAM, version: 5 });
    expect(parseProgramEvent(event, PROGRAM)).toEqual({ event });
  });
});

describe('untrusted JSON is rejected at the public parsing boundary', () => {
  it.each([null, false, 7, 'snapshot', [], ['snapshot']])('rejects non-record snapshots and events: %j', (payload) => {
    const result = parseProgramSnapshot(payload, PROGRAM);
    expect(result.accepted).toBe(false);
    expect(result.state).toBeNull();
    expect(result.diagnostic).toMatchObject({ code: 'malformed-snapshot' });
    expect(result.diagnostic?.payload).toBe(payload);
    const event = parseProgramEvent(payload, PROGRAM);
    expect(event.event).toBeNull();
    expect(event.diagnostic).toMatchObject({ code: 'malformed-event' });
    expect(event.diagnostic?.payload).toBe(payload);
  });

  it.each([{}, { type: 1 }, { type: '' }, { type: ' \n\t' }])('rejects an absent or invalid event type: %j', (payload) => {
    const result = parseProgramEvent(payload, PROGRAM);
    expect(result.event).toBeNull();
    expect(result.diagnostic).toMatchObject({ code: 'malformed-event' });
    expect(result.diagnostic?.payload).toBe(payload);
  });

  it.each([null, '1', -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid snapshot versions: %j', (version) => {
    const payload = snapshot();
    payload.version = version;
    expect(parseProgramSnapshot(payload, PROGRAM)).toMatchObject({
      accepted: false, state: null, diagnostic: { code: 'malformed-snapshot' },
    });
  });

  it.each(STATE_TYPES)('requires a valid version for state event %s', (type) => {
    for (const version of [null, -1, 0.5, '5', Number.MAX_SAFE_INTEGER + 1]) {
      const payload = wire({ type, programId: PROGRAM, version });
      const result = parseProgramEvent(payload, PROGRAM);
      expect(result.event).toBeNull();
      expect(result.diagnostic).toMatchObject({ code: 'malformed-event' });
      expect(result.diagnostic?.payload).toBe(payload);
    }
    expect(parseProgramEvent({ type, programId: PROGRAM }, PROGRAM).event).toBeNull();
  });

  it.each([2, '1', null])('rejects incompatible explicit schema versions: %j', (schemaVersion) => {
    for (const payload of [
      { ...snapshot(), schemaVersion },
      { type: 'scene_cleared', programId: PROGRAM, version: 5, schemaVersion },
    ]) {
      const snapshotResult = 'type' in payload ? null : parseProgramSnapshot(payload, PROGRAM);
      const diagnostic = snapshotResult?.diagnostic ?? parseProgramEvent(payload, PROGRAM).diagnostic;
      expect(diagnostic?.code).toBe('incompatible-schema');
      expect(diagnostic?.payload).toBe(payload);
      expect(diagnostic?.message).toContain('Expected live-program schema 1');
    }
  });

  it('rejects a different program on both public wire boundaries', () => {
    const statePayload = { ...snapshot(), programId: 'other-program' };
    const eventPayload = { type: 'scene_cleared', programId: 'other-program', version: 5 };
    const stateResult = parseProgramSnapshot(statePayload, PROGRAM);
    const eventResult = parseProgramEvent(eventPayload, PROGRAM);
    expect(stateResult).toMatchObject({ accepted: false, state: null });
    expect(eventResult.event).toBeNull();
    for (const [diagnostic, payload] of [[stateResult.diagnostic, statePayload], [eventResult.diagnostic, eventPayload]] as const) {
      expect(diagnostic?.code).toBe('program-mismatch');
      expect(diagnostic?.payload).toBe(payload);
      expect(diagnostic?.message).toContain('other-program');
    }
  });

  it.each([
    ['id', '1'], ['updatedAt', null], ['activeSceneId', '7'],
    ['activeScene', []], ['stagedScene', 'scene'],
  ])('rejects a malformed snapshot field %s', (field, value) => {
    const payload = snapshot();
    payload[field as string] = value;
    const result = parseProgramSnapshot(payload, PROGRAM);
    expect(result).toMatchObject({ accepted: false, state: null, diagnostic: { code: 'malformed-snapshot' } });
    expect(result.diagnostic?.payload).toBe(payload);
  });

  it.each(['id', 'version', 'updatedAt', 'activeSceneId', 'activeScene'])('rejects an omitted required snapshot field %s', (field) => {
    const payload = snapshot();
    delete payload[field];
    expect(parseProgramSnapshot(payload, PROGRAM).accepted).toBe(false);
  });

  it.each([
    ['layout', null], ['layout', []], ['id', '7'], ['name', 9], ['layoutId', '2'],
    ['layout.id', '2'], ['layout.name', false], ['layout.componentType', 3],
    ['layout.settings', {}], ['chyronText', false], ['metadata', []],
  ])('rejects untrusted scene field %s within a snapshot', (path, value) => {
    const payload = snapshot();
    const candidate: JsonObject = wire(scene());
    const [first, second] = String(path).split('.');
    if (second) (candidate[first] as JsonObject)[second] = value;
    else candidate[first] = value;
    payload.activeScene = candidate;
    const result = parseProgramSnapshot(payload, PROGRAM);
    expect(result).toMatchObject({ accepted: false, diagnostic: { code: 'malformed-snapshot' } });
    expect(result.diagnostic?.payload).toBe(payload);
  });
});

describe('snapshot ordering and restart reconciliation', () => {
  it('admits the first valid snapshot and a newer one without mutating either payload', () => {
    const current = currentState();
    const payload = snapshot(5);
    expect(reconcileProgramSnapshot(null, payload, PROGRAM).state).toBe(payload);
    expect(reconcileProgramSnapshot(current, payload, PROGRAM).state).toBe(payload);
    expect(current.version).toBe(4);
  });

  it.each(['2026-10-25T11:59:59.000Z', 'invalid-date'])('keeps the last good state on an older-version snapshot dated %s', (updatedAt) => {
    const current = currentState();
    const payload = snapshot(1, updatedAt);
    const result = reconcileProgramSnapshot(current, payload, PROGRAM);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(current);
    expect(result.diagnostic).toMatchObject({ code: 'stale-update' });
    expect(result.diagnostic?.payload).toBe(payload);
  });

  it.each(['2026-10-25T12:00:00.000Z', '2026-10-25T12:00:01.000Z'])('accepts a restarted version counter with non-older timestamp %s', (updatedAt) => {
    const current = currentState();
    const payload = snapshot(0, updatedAt);
    expect(reconcileProgramSnapshot(current, payload, PROGRAM)).toEqual({ accepted: true, state: payload });
  });

  it('rejects the same version even when a later timestamp arrives', () => {
    const current = currentState();
    const result = reconcileProgramSnapshot(current, snapshot(4, '2026-10-25T12:00:01.000Z'), PROGRAM);
    expect(result.state).toBe(current);
    expect(result.accepted).toBe(false);
    expect(result.diagnostic?.code).toBe('stale-update');
  });

  it('returns a diagnostic for a rejected wire snapshot without mutating current state', () => {
    const current = currentState();
    const before = wire(current);
    const payload = { ...snapshot(5), version: -1 };
    expect(reconcileProgramSnapshot(current, payload, PROGRAM).accepted).toBe(false);
    expect(current).toEqual(before);
  });
});

describe('admitted SSE events reconcile through the public state boundary', () => {
  it.each(REPLACEMENT_TYPES)('applies a full %s snapshot with the event version as authority', (type) => {
    const current = currentState();
    const replacement = snapshot(1);
    const payload = wire({ type, programId: PROGRAM, schemaVersion: 1, version: 5, state: replacement });
    const event = admittedEvent(payload);
    expect(isProgramStateEvent(event)).toBe(true);
    const result = reconcileProgramEvent(current, event);
    expect(result.accepted).toBe(true);
    expect(result.state).toEqual({ ...replacement, version: 5 });
    expect(result.state).not.toBe(current);
    expect(replacement.version).toBe(1);
    expect(payload.state.version).toBe(1);
    expect(current.version).toBe(4);
  });

  it('can bootstrap directly from a valid state event before a snapshot fetch completes', () => {
    const payload = wire({ type: 'scene_change', programId: PROGRAM, version: 1, state: snapshot(0) });
    expect(reconcileProgramEvent(null, admittedEvent(payload))).toMatchObject({ accepted: true, state: { version: 1 } });
  });

  it('uses the current program identity for a compatible event omitting its optional programId', () => {
    const current = currentState();
    const event = admittedEvent(wire({ type: 'scene_change', version: 5, state: snapshot(0) }));
    expect(reconcileProgramEvent(current, event)).toMatchObject({ accepted: true, state: { programId: PROGRAM, version: 5 } });
  });

  it.each([3, 4])('preserves the current instance for stale event version %s', (version) => {
    const current = currentState();
    const event = admittedEvent(wire({ type: 'scene_cleared', programId: PROGRAM, version }));
    const result = reconcileProgramEvent(current, event);
    expect(result.state).toBe(current);
    expect(result.accepted).toBe(false);
    expect(result.diagnostic).toMatchObject({ code: 'stale-update' });
    expect(result.diagnostic?.payload).toBe(event);
  });

  it.each(['scene_staged', 'scene_update', 'scene_cleared'])('rejects %s before a valid initial state', (type) => {
    const event = admittedEvent(wire({ type, programId: PROGRAM, version: 1, scene: scene() }));
    const result = reconcileProgramEvent(null, event);
    expect(result).toMatchObject({ accepted: false, state: null, diagnostic: { code: 'malformed-event' } });
    expect(result.diagnostic?.message).toContain('before a valid snapshot');
    expect(result.diagnostic?.payload).toBe(event);
  });

  it.each([null, 'scene'])('stages or clears a canonical scene: %s', (variant) => {
    const current = currentState();
    const staged = variant === null ? null : scene();
    const event = admittedEvent(wire({ type: 'scene_staged', programId: PROGRAM, version: 5, scene: staged, stagedSceneId: staged?.id ?? null }));
    const result = reconcileProgramEvent(current, event);
    expect(result).toEqual({ accepted: true, state: { ...current, stagedScene: staged, stagedSceneId: staged?.id ?? null, version: 5 } });
    expect(result.state).not.toBe(current);
    expect(current.stagedScene).toBeNull();
  });

  it.each(['scene_staged', 'scene_update'])('rejects untrusted scene content in %s without replacing the good state', (type) => {
    const current = currentState();
    const event = admittedEvent(wire({ type, programId: PROGRAM, version: 5, scene: { id: 7 } }));
    const result = reconcileProgramEvent(current, event);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(current);
    expect(result.diagnostic).toMatchObject({ code: 'malformed-event' });
    expect(result.diagnostic?.payload).toBe(event);
  });

  it('updates the active scene content and clears it in subsequent ordered events', () => {
    const current = currentState();
    const changedScene = { ...scene(), name: 'Updated headlines' };
    const update = admittedEvent(wire({ type: 'scene_update', programId: PROGRAM, version: 5, scene: changedScene }));
    const updated = reconcileProgramEvent(current, update);
    expect(updated).toEqual({ accepted: true, state: { ...current, activeScene: changedScene, version: 5 } });
    const clear = admittedEvent(wire({ type: 'scene_cleared', programId: PROGRAM, version: 6 }));
    expect(reconcileProgramEvent(updated.state, clear)).toEqual({ accepted: true, state: { ...updated.state, activeSceneId: null, activeScene: null, version: 6 } });
    expect(current.activeScene?.name).toBe('Headlines');
  });

  it('rejects malformed nested state only after the envelope passes event parsing', () => {
    const current = currentState();
    const event = admittedEvent(wire({ type: 'scene_change', programId: PROGRAM, version: 5, state: { ...snapshot(1), activeScene: [] } }));
    const result = reconcileProgramEvent(current, event);
    expect(result.accepted).toBe(false);
    expect(result.diagnostic?.code).toBe('malformed-snapshot');
    expect(current).toEqual(snapshot());
  });

  it.each([
    ['programId', 'other-program', 'program-mismatch'],
    ['schemaVersion', 2, 'incompatible-schema'],
  ])('rejects nested %s disagreement despite an admitted event envelope', (field, value, code) => {
    const current = currentState();
    const replacement = { ...snapshot(1), [field]: value };
    const payload = wire({ type: 'scene_change', programId: PROGRAM, version: 5, state: replacement });
    const before = wire(payload);
    const result = reconcileProgramEvent(current, admittedEvent(payload));
    expect(result.accepted).toBe(false);
    expect(result.diagnostic?.code).toBe(code);
    expect(result.diagnostic?.payload).toEqual({ ...replacement, version: 5 });
    expect(payload).toEqual(before);
    expect(current).toEqual(snapshot());
  });

  it('rejects a missing replacement state and leaves current state untouched', () => {
    const current = currentState();
    const event = admittedEvent(wire({ type: 'scene_change', programId: PROGRAM, version: 5 }));
    const result = reconcileProgramEvent(current, event);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(current);
    expect(result.diagnostic?.code).toBe('malformed-event');
  });

  it('admits a supported non-state signal without changing the current state identity', () => {
    const payload = wire({ type: 'broadcast_settings_update', programId: PROGRAM, settings: {} });
    const event = admittedEvent(payload);
    expect(isProgramStateEvent(event)).toBe(false);
    for (const current of [null, currentState()]) {
      const result = reconcileProgramEvent(current, event);
      expect(result.accepted).toBe(true);
      expect(result.state).toBe(current);
      expect(result.diagnostic).toBeUndefined();
    }
  });
});

describe('program endpoint accepts supported deployment configurations', () => {
  it('uses the actual server-side fallback and normalizes public program identifiers', () => {
    expect(resolveProgramEndpoint(undefined, ' ')).toBe('http://127.0.0.1:3000/program/fifthbell');
    expect(resolveProgramEndpoint('  ', 'evening news')).toBe('http://127.0.0.1:3000/program/evening%20news');
    expect(resolveProgramEndpoint(' https://api.example.test/// ', ' fifthbell ')).toBe('https://api.example.test/program/fifthbell');
    expect(resolveProgramEndpoint('https://api.example.test/program/', 'evening news')).toBe('https://api.example.test/program/evening%20news');
    expect(resolveProgramEndpoint('https://api.example.test/program/fixed/', PROGRAM)).toBe('https://api.example.test/program/fixed');
  });
});
