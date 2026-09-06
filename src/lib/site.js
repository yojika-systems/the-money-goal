/* Site-wide constants and the partner/offer record.
 *
 * Everything the site claims about who runs it and how it earns comes from
 * here, so a fact can never be stated two different ways on two pages. The
 * previous site duplicated its disclosure copy in assets/site.js and again in
 * alice-blue-partner.html, and stored the referral URL in a config file that
 * shipped EMPTY — so every money CTA popped an alert() for months.
 *
 * UNVERIFIED FACTS ARE `null`, NEVER A GUESS. Components omit a field that is
 * null rather than rendering a placeholder, and scripts/check-placeholders.mjs
 * lists every null at build time and hard-fails if a bracketed placeholder
 * string ever reaches the source or the build output.
 */

export const SITE = {
  url: 'https://themoneygoal.com',
  name: 'The MoneyGoal',
  tagline: 'Independent financial education · India',
  description:
    'Learn how money works in plain language — budgeting, mutual funds, SIPs and building financial freedom. Free educational guides for Indian investors.',
  locale: 'en_IN',
  startYear: 2026,
};

/** Who operates the site. Named authorship is the E-E-A-T signal for YMYL finance. */
export const OPERATOR = {
  name: 'Sathya Sankar',
  role: 'Authorised Person, Alice Blue',
  initials: 'SS',
  /* Exchange-issued Authorised Person registration number, from the AP
   * agreement. SKEL577 is a PARTNER CODE, not this number. SEBI circular
   * HO/(79)2026-MIRSD-PODMMC (in force 1 May 2026) requires agents of
   * regulated entities to display a registration number on securities content.
   * Unset until confirmed — the byline renders without it rather than guessing. */
  apRegistrationNumber: null,
};

/** The one partner today. Banks and card issuers get their own records later. */
export const PARTNER = {
  id: 'alice-blue',
  displayName: 'Alice Blue',
  legalName: 'Alice Blue Financial Services (P) Ltd',
  sebiRegistration: 'INZ000156038',
  dpRegistration: 'IN-DP-364-2018',
  partnerCode: 'SKEL577',
  partnerSince: '2024-01-16',
  partnerSinceLabel: 'January 2024',
  compensation: 'a share of brokerage',
  /* The account-opening (Digi Link) URL. Verified 2026-09-06: returns 200 and
   * the source parameter survives the redirect chain. */
  referralUrl: 'https://ekyc.aliceblueonline.com/?source=SKEL577',
  exitHost: 'ekyc.aliceblueonline.com',
  rel: 'noopener sponsored',
  /* Charges are set and published by Alice Blue, not by us. Every one of these
   * must be copied from their official charges page before the partner page
   * states a number. Null renders as "see Alice Blue's charges page". */
  charges: {
    accountOpening: null,
    annualMaintenance: null,
    equityDelivery: null,
    intradayAndFno: null,
  },
};

/** True when every charge figure has been verified — gates the charges table. */
export const chargesVerified = Object.values(PARTNER.charges).every((v) => v !== null);
