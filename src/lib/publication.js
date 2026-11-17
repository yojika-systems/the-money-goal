export const MARKETS = { global: 'Global basics', IN: 'India', US: 'United States' };
export const TOPICS = [
  { id: 'budgeting-debt', name: 'Budgeting & debt', description: 'Understand cash flow, emergency savings and repayment costs.' },
  { id: 'financial-independence', name: 'Financial independence', description: 'Explore targets, inflation and the assumptions behind a plan.' },
  { id: 'banking', name: 'Banking & transfers', description: 'Understand interest, account fees and moving money.' },
  { id: 'credit-cards', name: 'Credit cards', description: 'Compare costs, rewards and the effect of carrying a balance.' },
  { id: 'investing', name: 'Investing', description: 'Learn about funds, instruments, fees and investment risk.' },
  { id: 'insurance', name: 'Insurance', description: 'Understand protection, exclusions and policy documents.' },
  { id: 'crypto', name: 'Crypto', description: 'Learn about custody, volatility and the limits of protection.' },
  { id: 'economy', name: 'Economy & policy', description: 'Understand official announcements and their effective dates.' },
];
export const isPublished = (data, now = new Date()) => !data.draft && data.verification?.status === 'verified' && new Date(data.pubDate) <= now;
export function postHref(post) {
  const { market = 'global', legacyUrl = false, lang = 'en' } = post.data;
  const slug = post.slug.replace(/^(?:in|us|hi|bn|ta|te|mr|gu|kn|ml|pa|or|as)\//, '');
  if (lang !== 'en') return `/${lang}/blog/${slug}`;
  return market !== 'global' && !legacyUrl ? `/${market.toLowerCase()}/blog/${slug}` : `/blog/${slug}`;
}
export const topicName = id => TOPICS.find(t => t.id === id)?.name ?? id;
