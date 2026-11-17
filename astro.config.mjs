// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeCalculations } from './src/lib/calculations.js';
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
    tailwind({ applyBaseStyles: false }),
  ],

  markdown: {
    rehypePlugins: [
      rehypeCalculations,
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
