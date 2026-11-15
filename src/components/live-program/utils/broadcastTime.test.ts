import { describe, expect, it } from 'vitest';
import {
  formatClockParts,
  getOverrideClockParts,
  type GlobalTimeOverride,
} from './broadcastTime.js';

describe('broadcastTime utils', () => {
  it('parses valid startTime and calculates elapsed clock parts', () => {
    const override: GlobalTimeOverride = {
      startTime: '14:30',
      startedAt: '2026-11-15T14:30:00.000Z',
    };
    const now = new Date('2026-11-15T14:35:45.000Z');
    const result = getOverrideClockParts(override, now);

    expect(result).toEqual({
      hours: 14,
      minutes: 35,
      seconds: 45,
    });
    expect(formatClockParts(result!)).toBe('14:35');
  });

  it('uses default now when now parameter is omitted', () => {
    const now = new Date();
    const override: GlobalTimeOverride = {
      startTime: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
      startedAt: now.toISOString(),
    };
    const result = getOverrideClockParts(override);
    expect(result).not.toBeNull();
  });

  it('handles clock wrapping over 24 hours', () => {
    const override: GlobalTimeOverride = {
      startTime: '23:50',
      startedAt: '2026-11-15T23:50:00.000Z',
    };
    const now = new Date('2026-11-16T00:15:10.000Z');
    const result = getOverrideClockParts(override, now);

    expect(result).toEqual({
      hours: 0,
      minutes: 15,
      seconds: 10,
    });
  });

  it('returns null for malformed startTime', () => {
    const validStartedAt = '2026-11-15T12:00:00.000Z';
    expect(getOverrideClockParts({ startTime: '', startedAt: validStartedAt })).toBeNull();
    expect(getOverrideClockParts({ startTime: 'invalid', startedAt: validStartedAt })).toBeNull();
    expect(getOverrideClockParts({ startTime: '24:00', startedAt: validStartedAt })).toBeNull();
    expect(getOverrideClockParts({ startTime: '12:60', startedAt: validStartedAt })).toBeNull();
  });

  it('returns null for invalid startedAt date', () => {
    expect(getOverrideClockParts({ startTime: '12:00', startedAt: 'not-a-date' })).toBeNull();
  });

  it('clamps elapsed seconds to 0 when now is before startedAt', () => {
    const override: GlobalTimeOverride = {
      startTime: '10:00',
      startedAt: '2026-11-15T12:00:00.000Z',
    };
    const now = new Date('2026-11-15T11:00:00.000Z');
    const result = getOverrideClockParts(override, now);

    expect(result).toEqual({
      hours: 10,
      minutes: 0,
      seconds: 0,
    });
  });
});
