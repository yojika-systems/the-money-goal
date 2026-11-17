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
export function futureValue(monthly, annualRate, years, timing = 'start') {
  if (![monthly, annualRate, years].every(Number.isFinite) || monthly < 0 || years < 0 || annualRate <= -12 || !['start', 'end'].includes(timing)) throw new RangeError('Invalid investment assumptions');
  const i = annualRate / 12;
  const n = years * 12;
  if (i === 0) return monthly * n;
  return monthly * (Math.expm1(n * Math.log1p(i)) / i) * (timing === 'start' ? 1 + i : 1);
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

/** Constant nominal gross rate less an annual fee; illustration, not NAV accounting. */
export function compareExpenses({ monthly, years, gross, lowFee, highFee, timing = 'start' }) {
  if (![gross, lowFee, highFee].every(Number.isFinite) || lowFee < 0 || highFee < 0 || lowFee > 1 || highFee > 1) throw new RangeError('Invalid fee');
  if (lowFee > highFee) throw new RangeError('The lower expense ratio must not exceed the higher ratio');
  const low = futureValue(monthly, gross - lowFee, years, timing);
  const high = futureValue(monthly, gross - highFee, years, timing);
  return { low, high, difference: low - high, invested: monthly * years * 12 };
}

/** Monthly interest, fixed minimums, and the same total budget for both strategies. */
export function debtPayoff(debts, budget, strategy = 'avalanche', maxMonths = 1200) {
  if (!['avalanche', 'snowball'].includes(strategy) || !Array.isArray(debts) || !debts.length || debts.length > 10 || !Number.isFinite(budget) || budget <= 0 || !Number.isInteger(maxMonths) || maxMonths < 1 || maxMonths > 1200) throw new RangeError('Invalid repayment inputs');
  const rows = debts.map((d, index) => {
    if (![d.balance, d.apr, d.minimum].every(Number.isFinite) || d.balance < 0 || d.apr < 0 || d.apr > 200 || d.minimum <= 0) throw new RangeError('Enter valid balances, APRs and minimum payments');
    return { ...d, index };
  });
  if (budget + 1e-7 < rows.filter(d => d.balance > 0).reduce((n, d) => n + Math.min(d.minimum, d.balance * (1 + d.apr / 1200)), 0)) throw new RangeError('Budget must cover all minimum payments');
  let interest = 0;
  const schedule = [];
  for (let month = 1; month <= maxMonths; month++) {
    if (rows.every(d => d.balance < 0.005)) return { paidOff: true, months: month - 1, interest, schedule };
    let remaining = budget;
    for (const d of rows) {
      const charge = d.balance * d.apr / 1200;
      interest += charge;
      d.balance += charge;
      const paid = Math.min(d.balance, d.minimum, remaining);
      d.balance -= paid;
      remaining -= paid;
    }
    const priority = [...rows].sort((a, b) => strategy === 'avalanche' ? b.apr - a.apr || a.balance - b.balance || a.index - b.index : a.balance - b.balance || b.apr - a.apr || a.index - b.index);
    for (const d of priority) {
      const paid = Math.min(d.balance, remaining);
      d.balance -= paid;
      remaining -= paid;
    }
    schedule.push({ month, balance: rows.reduce((n, d) => n + d.balance, 0), interest });
  }
  return { paidOff: rows.every(d => d.balance < 0.005), months: maxMonths, interest, schedule };
}

/** Incremental rewards over a no-fee alternative; cap is annual reward units. */
export function cardBreakEven({ spend, fee, feeRate, freeRate, cap = Infinity, excluded = 0, interest = 0, otherFees = 0 }) {
  if (![spend, fee, feeRate, freeRate, excluded, interest, otherFees].every(Number.isFinite) || [spend, fee, feeRate, freeRate, excluded, interest, otherFees].some(n => n < 0) || feeRate > 1 || freeRate > 1 || excluded > spend || !(typeof cap === 'number' && cap >= 0)) throw new RangeError('Invalid card inputs');
  const eligible = spend - excluded;
  const extraRewards = Math.min(eligible * feeRate, cap) - eligible * freeRate;
  const cost = fee + interest + otherFees;
  const threshold = cost === 0 ? 0 : feeRate > freeRate ? cost / (feeRate - freeRate) : Infinity;
  const breakEven = Number.isFinite(threshold) && threshold * feeRate <= cap + 1e-8 ? threshold : null;
  return { eligible, extraRewards, net: extraRewards - cost, breakEven };
}

export const expenseIllustration = () => [10, 20, 25].map(years => ({ years, ...compareExpenses({ monthly: 10000, years, gross: 0.12, lowFee: 0.002, highFee: 0.016 }) }));
