/* The primary navigation, in one array.
 *
 * Replaces the runtime route map in assets/site.js, which rewrote every
 * a[data-path] href on load — the reason all 54 internal links on the four
 * largest pages were literally href="#" in the served HTML.
 */
export const NAV = [
  { label: 'Guides', href: '/guides' },
  { label: 'Mutual funds', href: '/mutual-funds' },
  { label: 'Financial freedom', href: '/financial-freedom' },
  { label: 'Money mistakes', href: '/money-mistakes' },
  { label: 'Financial health', href: '/financial-health' },
  { label: 'Calculators', href: '/calculators' },
];

export const FOOTER_NAV = {
  Learn: [
    { label: 'Mutual funds', href: '/mutual-funds' },
    { label: 'Financial freedom', href: '/financial-freedom' },
    { label: 'Money mistakes', href: '/money-mistakes' },
    { label: 'Financial health', href: '/financial-health' },
  ],
  Tools: [
    { label: 'SIP calculator', href: '/calculators' },
    { label: 'Freedom planner', href: '/financial-freedom' },
    { label: 'Health check', href: '/financial-health' },
  ],
  Transparency: [
    { label: 'How we make money', href: '/partner' },
    { label: 'Partner disclosure', href: '/partner' },
    { label: 'All guides', href: '/guides' },
  ],
};
