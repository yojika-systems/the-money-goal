// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import rehypeExternalLinks from 'rehype-external-links';
import { LANGUAGE_CODES, LANGUAGE_HREFLANGS, DEFAULT_LANG } from './src/lib/languages.js';

/* rehype-external-links calls `test` FIRST, unconditionally, before it checks
 * the protocol — so the callback must tolerate any node, including ones with no
 * href at all. Returning true only for absolute http(s) URLs off our own host
 * keeps in-page anchors and relative links untouched. */
const EXTERNAL_LINK_TEST = (element) => {
  const href = element?.properties?.href;
  if (typeof href !== 'string') return false;
  if (!/^https?:\/\//i.test(href)) return false;
  return !href.startsWith('https://themoneygoal.com');
};

export default defineConfig({
  site: 'https://themoneygoal.com',

  /* Reproduces the URL contract the live site already has: `format: 'file'`
   * emits dist/learn.html, Cloudflare Pages serves it at /learn and 308s
   * /learn.html -> /learn natively. Every existing indexed URL survives. */
  trailingSlash: 'never',
  build: { format: 'file' },

  i18n: {
    defaultLocale: DEFAULT_LANG,
    locales: LANGUAGE_CODES,
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    mdx(),
    /* The i18n option only works because language is the FIRST path segment
     * (/hi/blog/x). @astrojs/sitemap matches locales against segment one, which
     * is why the Yojika monorepo's /blog/<lang>/<slug> shape emits no
     * xhtml:link annotations at all despite publishing in 12 languages. */
    sitemap({
      i18n: { defaultLocale: DEFAULT_LANG, locales: LANGUAGE_HREFLANGS },
      filter: (page) => !page.endsWith('/404'),
    }),
    tailwind({ applyBaseStyles: false }),
  ],

  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
          protocols: ['http', 'https'],
          test: EXTERNAL_LINK_TEST,
        },
      ],
    ],
  },
});
