import { defineCollection, z } from 'astro:content';
import { LANGUAGE_CODES, DEFAULT_LANG } from '../lib/languages.js';
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70), description: z.string().min(80).max(170),
    pubDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    author: z.string().default('The MoneyGoal editorial system'),
    category: z.string(), topic: z.string(), tags: z.array(z.string()).default([]),
    lang: z.enum(LANGUAGE_CODES as [string, ...string[]]).default(DEFAULT_LANG),
    translationKey: z.string(), draft: z.boolean().default(true),
    market: z.enum(['global', 'IN', 'US']), legacyUrl: z.boolean().default(false),
    contentType: z.enum(['evergreen', 'news', 'comparison']),
    aiAssisted: z.boolean().default(true), automationRunId: z.string().optional(),
    reviewDue: z.coerce.date(), offerIds: z.array(z.string()).default([]),
    calculationRefs: z.array(z.string()).default([]),
    sources: z.array(z.object({ id: z.string(), title: z.string(), publisher: z.string(), url: z.string().url(), accessed: z.coerce.date(), published: z.coerce.date().optional(), effective: z.coerce.date().optional() })).min(1),
    evidence: z.array(z.object({ id: z.string(), claim: z.string(), sourceId: z.string(), excerpt: z.string().max(1000) })).min(1),
    verification: z.object({ status: z.enum(['draft', 'held', 'verified']), checkedAt: z.coerce.date(), method: z.string(), reasons: z.array(z.string()).default([]) }),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    affiliate: z.boolean().default(false), heroImage: z.string().optional(), ogImage: z.string().optional(),
  }),
});
export const collections = { blog };
