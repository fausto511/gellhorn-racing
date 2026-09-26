// Sign-ups for SAMPLE events (RS-0033, DEC-0075). Sample events are not in
// the database, so "I'm in" on them is stored in this browser only -- enough
// to show visitors how signing up works before real events exist. Ignored
// as soon as real events are published.
const KEY = 'gh-sample-rsvps';

export function sampleRsvps(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { return new Set(); }
}
export function setSampleRsvp(id: string, going: boolean): Set<string> {
  const s = sampleRsvps();
  if (going) s.add(id); else s.delete(id);
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* private mode: keep in memory only */ }
  return s;
}
