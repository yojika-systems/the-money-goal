/** Long-form date: "6 September 2026". Used in bylines and article metadata. */
export function dmyLong(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Machine-readable date for <time datetime> and JSON-LD. */
export function iso(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

/** Rough reading time in whole minutes, floored at 1. */
export function readingMinutes(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
