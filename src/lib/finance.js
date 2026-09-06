/* Shared financial maths. One implementation, used by every calculator.
 *
 * The pre-Astro site had two different SIP formulas on two pages, and a third
 * "planner" that used neither — financial-freedom.html computed a retirement
 * age from invented constants (baseYears = 18.0, a magic 0.231, a Math.max(7.2)
 * floor) under a comment calling it a "simplified empirical financial
 * acceleration curve". No such curve exists. These are the real ones.
 */

/**
 * Future value of a level monthly investment, as an ANNUITY-DUE.
 *
 * An SIP debits at the START of each month, so every instalment earns one extra
 * month of return versus an ordinary annuity — hence the trailing (1+i). The
 * difference is about 1% of the final figure, and getting it wrong is why two
 * calculators on the old site disagreed with each other.
 *
 *   FV = PMT · ((1+i)^n − 1)/i · (1+i)
 */
export function futureValue(monthly, annualRate, years) {
  const i = annualRate / 12;
  const n = years * 12;
  if (i === 0) return monthly * n;
  return monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

/**
 * Years of level monthly investing needed to reach a target, from zero.
 * The inverse of futureValue(), so the two can never disagree. Solving
 * FV = PMT · ((1+i)^n − 1)/i · (1+i) for n gives:
 *   n = ln(1 + FV·i / (PMT·(1+i))) / ln(1+i)
 */
export function yearsToTarget(monthly, target, annualRate) {
  if (monthly <= 0 || target <= 0) return 0;
  const i = annualRate / 12;
  if (i === 0) return target / monthly / 12;
  return Math.log(1 + (target * i) / (monthly * (1 + i))) / Math.log(1 + i) / 12;
}

/** The Rule of 25 / 4% withdrawal rule: the corpus that sustains an annual spend. */
export const targetCorpus = (annualExpenses, multiple = 25) => annualExpenses * multiple;

/** Indian short-scale formatting: 75.6 L, 1.05 Cr. */
export function inrCompact(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export const inr = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;
