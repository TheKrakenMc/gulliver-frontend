import type { Shift } from './types';
export function intervalsFor(shift: Shift) {
  const result: { starts_at: string; ends_at: string }[] = [];
  const end = Date.parse(shift.plan_snapshot.ends_at);
  for (let start = Date.parse(shift.plan_snapshot.starts_at); start < end; start += 3600000) {
    result.push({ starts_at: new Date(start).toISOString(), ends_at: new Date(Math.min(start + 3600000, end)).toISOString() });
  }
  return result;
}
export function plantTime(value: string, zone: string) {
  return new Intl.DateTimeFormat('es-MX', { timeZone: zone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}
function localParts(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return get('year') + '-' + get('month') + '-' + get('day') + 'T' + get('hour') + ':' + get('minute');
}
/** Enumerates both occurrences of an ambiguous local time and rejects DST gaps. */
export function possibleInstants(local: string, zone: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
  const nominal = Date.parse(local + ':00Z');
  const matches: string[] = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
    const candidate = new Date(nominal - offset * 60000);
    if (localParts(candidate, zone) === local) matches.push(candidate.toISOString());
  }
  return matches.sort();
}
