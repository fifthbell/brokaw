import { describe, expect, it } from 'vitest';
import {
  LIVE_PROGRAM_SCHEMA_VERSION,
  parseProgramEvent,
  reconcileProgramEvent,
  reconcileProgramSnapshot,
  resolveProgramEndpoint,
  type ProgramState,
} from './program-contract.js';

const snapshot = (version: number): ProgramState => ({
  id: 1,
  programId: 'fifthbell',
  activeSceneId: null,
  activeScene: null,
  stagedSceneId: null,
  stagedScene: null,
  updatedAt: `2026-08-29T17:00:${String(version).padStart(2, '0')}.000Z`,
  version,
});

describe('live-program Alcantara contract', () => {
  it('builds program-scoped endpoints while preserving a configured full endpoint', () => {
    expect(resolveProgramEndpoint('https://api.example.test', 'fifth bell')).toBe('https://api.example.test/program/fifth%20bell');
    expect(resolveProgramEndpoint('https://api.example.test/program', 'fifthbell')).toBe('https://api.example.test/program/fifthbell');
    expect(resolveProgramEndpoint('https://api.example.test/program/fifthbell/', 'ignored')).toBe('https://api.example.test/program/fifthbell');
  });

  it('accepts an initial snapshot and reconciles a newer snapshot after a dropped stream', () => {
    const initial = reconcileProgramSnapshot(null, snapshot(2), 'fifthbell');
    expect(initial).toMatchObject({ accepted: true, state: { version: 2 } });

    const reconnected = reconcileProgramSnapshot(initial.state, snapshot(5), 'fifthbell');
    expect(reconnected).toMatchObject({ accepted: true, state: { version: 5 } });
  });

  it('accepts a non-older snapshot when Alcantara restarts its in-memory version counter', () => {
    const beforeRestart = snapshot(12);
    const afterRestart = { ...snapshot(0), updatedAt: beforeRestart.updatedAt };
    expect(reconcileProgramSnapshot(beforeRestart, afterRestart, 'fifthbell')).toMatchObject({
      accepted: true,
      state: { version: 0 },
    });
  });

  it('applies a newer program-scoped SSE state event', () => {
    const parsed = parseProgramEvent({
      type: 'scene_cleared',
      programId: 'fifthbell',
      schemaVersion: LIVE_PROGRAM_SCHEMA_VERSION,
      version: 3,
    }, 'fifthbell');
    expect(parsed.diagnostic).toBeUndefined();
    const result = reconcileProgramEvent({ ...snapshot(2), activeSceneId: 7 }, parsed.event!);
    expect(result).toMatchObject({ accepted: true, state: { activeSceneId: null, version: 3 } });
  });

  it('rejects stale and out-of-order SSE updates without corrupting the last good state', () => {
    const current = snapshot(4);
    for (const version of [4, 3]) {
      const parsed = parseProgramEvent({ type: 'scene_cleared', programId: 'fifthbell', version }, 'fifthbell');
      const result = reconcileProgramEvent(current, parsed.event!);
      expect(result.state).toBe(current);
      expect(result).toMatchObject({ accepted: false, diagnostic: { code: 'stale-update' } });
    }
  });

  it('rejects malformed, incompatible, and cross-program payloads diagnostically', () => {
    expect(parseProgramEvent({ programId: 'fifthbell' }, 'fifthbell')).toMatchObject({ event: null, diagnostic: { code: 'malformed-event' } });
    expect(parseProgramEvent({ type: 'scene_cleared', version: 1, schemaVersion: 2 }, 'fifthbell')).toMatchObject({ event: null, diagnostic: { code: 'incompatible-schema' } });
    expect(parseProgramEvent({ type: 'scene_cleared', version: 1, programId: 'other' }, 'fifthbell')).toMatchObject({ event: null, diagnostic: { code: 'program-mismatch' } });
  });
});
