import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site.js';
import { DEFAULT_LANG, articleHref } from '../lib/languages.js';

/* English feed only. A mixed-language feed is unreadable in a reader; the
 * per-language feeds can follow when those languages have articles. */
export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.lang === DEFAULT_LANG))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: articleHref(DEFAULT_LANG, post.slug),
    })),
  });
}
