#!/usr/bin/env node
/* Post-build verification of the things that were actually broken before.
 *
 * Each check exists because the pre-Astro site failed it in production:
 *  · every page carries title, meta description and canonical — four of nine
 *    pages shipped with no description, and none had a canonical at all;
 *  · the canonical is byte-identical to the sitemap entry for the same page,
 *    so Google is never asked to choose between two spellings of one URL;
 *  · no href="#" survives — all 54 internal links on the four largest pages
 *    were href="#" in the served HTML, assigned only at runtime by JS;
 *  · every internal link resolves to a page that exists in the build output;
 *  · the compliance text is IN the HTML, not injected on load;
 *  · a 404 page exists, since its absence made every unknown URL a soft-404.
 *
 * Zero dependencies.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const fail = [];
const warn = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.html')) out.push(full);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('  dist/ not found — run the build first.');
  process.exit(1);
}

const pages = walk(DIST);
const sitemapUrls = new Set();
for (const f of readdirSync(DIST)) {
  if (/^sitemap-\d+\.xml$/.test(f)) {
    const xml = readFileSync(join(DIST, f), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(m[1]);
  }
}

/** dist/foo.html -> /foo ; dist/index.html -> '' (matches the sitemap's bare origin) */
const routeOf = (file) => {
  const rel = relative(DIST, file).replace(/\\/g, '/').replace(/\.html$/, '');
  return rel === 'index' ? '' : '/' + rel.replace(/\/index$/, '');
};

const built = new Set(pages.map(routeOf));

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const route = routeOf(file);
  const at = relative(DIST, file);
  const is404 = route === '/404';

  if (!/<title>[^<]+<\/title>/.test(html)) fail.push(`${at}: no <title>`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc || desc[1].trim().length < 40) fail.push(`${at}: missing or too-short meta description`);

  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canon) fail.push(`${at}: no canonical`);
  else if (!is404) {
    const expected = 'https://themoneygoal.com' + route;
    if (canon[1] !== expected) fail.push(`${at}: canonical ${canon[1]} != ${expected}`);
    if (sitemapUrls.size && !sitemapUrls.has(canon[1]))
      fail.push(`${at}: canonical ${canon[1]} is not in the sitemap`);
  }

  const dead = (html.match(/href="#"/g) ?? []).length;
  if (dead) fail.push(`${at}: ${dead} dead href="#" link(s)`);

  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, '');
    if (/\.(svg|png|jpe?g|ico|xml|txt|css|js|webmanifest)$/.test(href)) continue;
    if (!built.has(href) && !existsSync(join(DIST, href.slice(1)))) {
      fail.push(`${at}: internal link ${m[1]} does not exist in the build`);
    }
  }

  if (!is404) {
    if (!html.includes('subject to market risks'))
      fail.push(`${at}: market-risk disclosure missing from the served HTML`);
    if (!html.includes('Investment Adviser or Research Analyst'))
      fail.push(`${at}: non-registration statement missing from the served HTML`);
  }

  for (const m of html.matchAll(/\[(?:[A-Z][A-Z0-9 _-]{2,})\]/g)) fail.push(`${at}: placeholder ${m[0]}`);
}

if (!existsSync(join(DIST, '404.html'))) fail.push('no 404.html — every unknown URL becomes a soft-404');
for (const f of ['_headers', '_redirects', 'robots.txt', 'favicon.svg'])
  if (!existsSync(join(DIST, f))) warn.push(`${f} missing from the build output`);

const partner = pages.find((p) => p.endsWith('partner.html'));
if (partner) {
  const html = readFileSync(partner, 'utf8');
  if (!/rel="noopener sponsored"/.test(html))
    fail.push('partner.html: affiliate link is missing rel="noopener sponsored"');
}

for (const w of warn) console.warn(`  warn: ${w}`);
if (fail.length) {
  console.error(`\n  BUILD CHECK FAILED — ${fail.length} problem(s):\n`);
  for (const f of fail) console.error(`    ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`  build check: ${pages.length} pages, ${sitemapUrls.size} sitemap urls, all clean`);
