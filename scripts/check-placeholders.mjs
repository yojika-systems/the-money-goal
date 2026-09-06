#!/usr/bin/env node
/* Build gate: unverified facts must never reach a rendered page.
 *
 * Two rules, and the first one is the reason this file exists. The previous
 * site shipped "Trusted by 42,000+ Learners", three invented testimonials and a
 * retirement projection computed from a made-up constant. Making the build
 * refuse to run is more reliable than remembering.
 *
 *  1. HARD FAIL — a bracketed placeholder ([VERIFY], [EXCHANGE AP NUMBER],
 *     [YOUR PRICE], lorem ipsum) anywhere under src/ or public/. These are
 *     markers for facts we do not have; rendering one is worse than omitting
 *     the whole field.
 *  2. WARN — a field in src/lib/site.js that is deliberately null because the
 *     underlying fact is unverified. Components omit these rather than guess,
 *     so the build is correct without them; the warning is the running to-do
 *     list, printed on every single build so it cannot be forgotten.
 *
 * Zero dependencies, on purpose: this must run before anything installs.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'public'];
const SCAN_EXT = new Set(['.astro', '.js', '.mjs', '.ts', '.md', '.mdx', '.css', '.html', '.json', '.txt', '.xml']);

/* A bracketed run of CAPS/spaces is our placeholder convention. The lorem test
 * is separate because filler prose is a different failure with the same cause. */
const PLACEHOLDER = /\[(?:[A-Z][A-Z0-9 _-]{2,})\]/g;
const LOREM = /\blorem ipsum\b/gi;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.astro') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(extname(full))) out.push(full);
  }
  return out;
}

const failures = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);
    src.split('\n').forEach((line, i) => {
      for (const re of [PLACEHOLDER, LOREM]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          failures.push(`${rel}:${i + 1}  ${m[0]}`);
        }
      }
    });
  }
}

/* Unverified facts, held as null in site.js. Keep this list in step with the
 * null-able fields there; a field that gains a real value drops off the report. */
const { OPERATOR, PARTNER } = await import('../src/lib/site.js');
const unverified = [];
if (!OPERATOR.apRegistrationNumber)
  unverified.push('OPERATOR.apRegistrationNumber — exchange-issued AP number, from the Alice Blue AP agreement (SKEL577 is a partner code, not this)');
for (const [key, value] of Object.entries(PARTNER.charges)) {
  if (value === null) unverified.push(`PARTNER.charges.${key} — copy from Alice Blue's published charges page`);
}

if (unverified.length) {
  console.warn(`\n  ${unverified.length} unverified fact(s) — these render as omitted, not guessed:`);
  for (const line of unverified) console.warn(`    · ${line}`);
  console.warn('');
}

if (failures.length) {
  console.error(`\n  BUILD REFUSED — ${failures.length} placeholder(s) would ship as visible text:\n`);
  for (const line of failures) console.error(`    ${line}`);
  console.error('\n  Replace each with a real value, or omit the field entirely.\n');
  process.exit(1);
}

console.log(`  placeholder check: clean (${unverified.length} field(s) omitted pending verification)`);
