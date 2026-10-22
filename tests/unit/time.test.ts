import { it, expect } from 'vitest';
import { possibleInstants, intervalsFor } from '../../src/industrial/time';
import type { Shift } from '../../src/industrial/types';
it('rejects nonexistent daylight-saving times and enumerates both repeated hours',()=>{
  expect(possibleInstants('2026-03-08T02:30','America/Chicago')).toEqual([]);
  expect(possibleInstants('2026-11-01T01:30','America/Chicago')).toEqual(['2026-11-01T06:30:00.000Z','2026-11-01T07:30:00.000Z']);
  expect(possibleInstants('2026-11-01T01:30','America/Mexico_City')).toHaveLength(1);
});
it('creates real elapsed intervals across midnight, fallback and partial hours',()=>{
  const shift={plan_snapshot:{starts_at:'2026-11-01T00:00:00-05:00',ends_at:'2026-11-01T03:30:00-06:00'}} as Shift;
  const intervals=intervalsFor(shift);
  expect(intervals).toHaveLength(5);
  expect(Date.parse(intervals.at(-1)!.ends_at)-Date.parse(intervals.at(-1)!.starts_at)).toBe(1800000);
});
