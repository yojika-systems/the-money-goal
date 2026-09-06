import { defineCollection, z } from 'astro:content';
import { LANGUAGE_CODES, DEFAULT_LANG } from '../lib/languages.js';

/* Blog collection.
 *
 * Field names are IDENTICAL to the Yojika monorepo's blog schema on purpose:
 * the content pipeline being ported writes exactly these keys, so keeping them
 * byte-compatible is what makes that pipeline portable without a rewrite.
 *
 * `translationKey` is the English slug, shared by all 12 language variants —
 * it is what joins them for the language switcher and the hreflang alternates.
 * There is no `canonical` field; canonical URLs are derived at render time so
 * they can never drift from the sitemap.
 *
 * `sources` has no counterpart in Yojika and is required here. A finance site
 * publishing an unsourced statistic is how "42,000+ learners" happened; the
 * content validator will refuse any numeric claim in the body that has no
 * matching entry.
 */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70, 'Title over 70 chars will be truncated in search results'),
    description: z.string().min(80).max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Sathya Sankar'),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    lang: z.enum(LANGUAGE_CODES as [string, ...string[]]).default(DEFAULT_LANG),
    translationKey: z.string(),
    heroImage: z.string().optional(),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
    /* Every factual claim needs a traceable source. */
    sources: z
      .array(
        z.object({
          title: z.string(),
          publisher: z.string(),
          url: z.string().url().optional(),
          accessed: z.coerce.date().optional(),
        }),
      )
      .default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    /* True when the article contains a partner link, so the layout can require
     * the affiliate disclosure block above the first one. */
    affiliate: z.boolean().default(false),
  }),
});

export const collections = { blog };
