/* Regulatory and disclosure copy — one source, rendered into STATIC HTML.
 *
 * On the previous site every one of these strings was injected by JavaScript
 * at runtime (assets/site.js rebuilt <footer> on load), so crawlers and
 * no-JS visitors never saw a single disclosure. They are components now, so
 * the text is in the served HTML.
 *
 * The wording is largely carried over from the old site, which got this part
 * right — see assets/site.js:71 and alice-blue-partner.html:20 in the history.
 */
import { OPERATOR, PARTNER } from './site.js';

/** Alice Blue's own mandated risk line — reproduce verbatim, do not paraphrase. */
export const MARKET_RISK =
  'Investments in securities markets are subject to market risks, including the possible loss of capital. Read all the related documents carefully before investing.';

export const EDUCATION_ONLY =
  'The MoneyGoal publishes general financial education and does not give personalised recommendations. It is not a SEBI-registered Investment Adviser or Research Analyst.';

export const AFFILIATE_SHORT =
  'Some links are partner links and we may be compensated when an account is opened through them; this does not change what you pay.';

/** Renders without the AP number until OPERATOR.apRegistrationNumber is set. */
export function credentialLine() {
  const ap = OPERATOR.apRegistrationNumber
    ? `, AP registration no. ${OPERATOR.apRegistrationNumber}`
    : '';
  return `${OPERATOR.name} is an Authorised Person of ${PARTNER.legalName} — SEBI Reg. ${PARTNER.sebiRegistration}, partner code ${PARTNER.partnerCode}${ap}, since ${PARTNER.partnerSinceLabel}.`;
}

/** The full referral disclosure for the partner page. */
export function referralDisclosure() {
  const ap = OPERATOR.apRegistrationNumber
    ? ` (AP registration no. ${OPERATOR.apRegistrationNumber})`
    : '';
  return `${OPERATOR.name}, operating ${'The MoneyGoal'}, is an Authorised Person of ${PARTNER.legalName} (SEBI Reg. ${PARTNER.sebiRegistration}; depository participant SEBI Reg. ${PARTNER.dpRegistration}), partner code ${PARTNER.partnerCode}${ap}, since 16 January 2024. We receive permitted compensation, in the form of ${PARTNER.compensation}, on accounts opened and traded through our referral link.`;
}

/** The complaints escalation path — stating it protects us as much as the reader. */
export const GRIEVANCE_PATH = [
  { step: '01', name: PARTNER.displayName, detail: 'Their investor grievance desk, first.' },
  { step: '02', name: 'The exchange', detail: 'NSE or BSE investor services.' },
  { step: '03', name: 'SEBI SCORES', detail: 'Or the ODR portal, last.' },
];

/** Hero panel copy: what the site is, and what it deliberately is not. */
export const WHAT_THIS_IS = [
  'Free explanations of how financial products work.',
  'Calculators that show every assumption.',
  'Written by an Alice Blue authorised person.',
];

export const WHAT_IT_ISNT = [
  'Not investment advice, and not personalised to you.',
  'No stock tips or buy/sell calls.',
  'Not a SEBI Investment Adviser or Research Analyst.',
];
