/* The financial health self-check, carried over verbatim from the pre-Astro
 * financial-health.html — the seven statements and their weights are unchanged.
 *
 * It scores in the browser and stores nothing. That claim is on the page, so it
 * has to stay true: no fetch, no localStorage, no analytics event.
 */
export const HEALTH_ITEMS = [
  {
    "weight": 15,
    "label": "I regularly spend less than I earn."
  },
  {
    "weight": 15,
    "label": "I know where my money went last month."
  },
  {
    "weight": 15,
    "label": "I have at least three months of essential expenses accessible."
  },
  {
    "weight": 15,
    "label": "I clear high-interest debt without rolling balances."
  },
  {
    "weight": 15,
    "label": "I have suitable health and life protection for my needs."
  },
  {
    "weight": 15,
    "label": "I invest consistently toward specific long-term goals."
  },
  {
    "weight": 10,
    "label": "My nominees and important financial records are current."
  }
];

/** Weights sum to 100. */
export const HEALTH_BANDS = [
  {
    max: 39,
    band: 'Priority: build stability',
    guidance:
      'Begin with expense visibility, high-interest debt, and a starter emergency buffer.',
    href: '/money-mistakes',
    cta: 'See the common mistakes',
  },
  {
    max: 74,
    band: 'Developing foundation',
    guidance:
      'Your basics are forming. Strengthen protection and automate goal-based saving or investing.',
    href: '/guides',
    cta: 'Explore the guides',
  },
  {
    max: 100,
    band: 'Strong financial foundation',
    guidance:
      'Maintain your systems, review protection annually, and keep long-term goals aligned.',
    href: '/financial-freedom',
    cta: 'Review financial freedom',
  },
];
