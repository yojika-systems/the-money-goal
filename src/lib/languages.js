/* Single source of truth for the site's supported languages.
 *
 * The 12 Indian-market languages The MoneyGoal publishes in. `en` is the
 * default and stays un-prefixed; every other language is prefixed.
 *
 * URL SHAPE — deliberately different from the Yojika monorepo this ports from.
 * Yojika uses /blog/<lang>/<slug>, which puts the language SECOND. @astrojs/sitemap
 * matches its i18n `locales` against the FIRST path segment, so Yojika's sitemap
 * emits no xhtml:link hreflang annotations at all (verified in its built output).
 * Here the language comes first — /<lang>/blog/<slug> — so sitemap hreflang works,
 * and localising the static pages later (/hi/mutual-funds) needs no URL change.
 * This is the most expensive thing to change once articles are indexed.
 *
 * Consumed by:
 *  - src/content/config.ts      (constrains the `lang` frontmatter field)
 *  - astro.config.mjs           (i18n.locales and the sitemap i18n map)
 *  - src/pages/[lang]/blog/**   (listings and articles)
 *  - src/layouts/Article.astro  (language switcher + hreflang alternates)
 */

/** Ordered list of supported languages. `en` is first / the default. */
export const LANGUAGES = [
  { code: 'en', name: 'English', hreflang: 'en-IN' },
  { code: 'hi', name: 'हिन्दी', hreflang: 'hi-IN' },
  { code: 'bn', name: 'বাংলা', hreflang: 'bn-IN' },
  { code: 'ta', name: 'தமிழ்', hreflang: 'ta-IN' },
  { code: 'te', name: 'తెలుగు', hreflang: 'te-IN' },
  { code: 'mr', name: 'मराठी', hreflang: 'mr-IN' },
  { code: 'gu', name: 'ગુજરાતી', hreflang: 'gu-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', hreflang: 'kn-IN' },
  { code: 'ml', name: 'മലയാളം', hreflang: 'ml-IN' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', hreflang: 'pa-IN' },
  { code: 'or', name: 'ଓଡ଼ିଆ', hreflang: 'or-IN' },
  { code: 'as', name: 'অসমীয়া', hreflang: 'as-IN' },
];

export const DEFAULT_LANG = 'en';

/** ['en', 'hi', …] — the Zod enum, astro i18n.locales, and route generation. */
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

/** { en: 'English', hi: 'हिन्दी', … } — self-name lookup by code. */
export const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name]));

/** { en: 'en-IN', hi: 'hi-IN', … } — the sitemap integration's i18n.locales map. */
export const LANGUAGE_HREFLANGS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.hreflang]));

/** Self-name for a code, falling back to the raw code if unknown. */
export const langName = (code) => LANGUAGE_NAMES[code] ?? code;

/** Non-default codes only — the languages that carry a URL prefix. */
export const PREFIXED_CODES = LANGUAGE_CODES.filter((c) => c !== DEFAULT_LANG);

/** Fast membership test for route guards. */
export const LANGUAGE_CODE_SET = new Set(LANGUAGE_CODES);
export const isLanguage = (code) => LANGUAGE_CODE_SET.has(code);

/** The path prefix for a language: '' for English, '/hi' for Hindi. */
export const langPrefix = (code) => (code === DEFAULT_LANG ? '' : `/${code}`);

/** The blog listing URL for a language: /blog, /hi/blog. */
export const listingHref = (code) => `${langPrefix(code)}/blog`;

/** The article URL for a slug in a language: /blog/x, /hi/blog/x. */
export const articleHref = (code, slug) => `${langPrefix(code)}/blog/${slug}`;

/**
 * Strip a leading language directory from a content slug: "hi/foo" -> "foo".
 *
 * Exists as a helper rather than an inline regex because the Astro compiler
 * mis-parses the `{2}` quantifier inside a regex literal in TEMPLATE position —
 * it reads the brace as a JSX expression boundary and fails with a syntax error.
 * Safe in frontmatter, breaks the build inside markup. Call this instead.
 */
export const stripLangPrefix = (slug) => slug.replace(/^[a-z]{2}\//, '');
