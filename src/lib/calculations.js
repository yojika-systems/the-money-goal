import { expenseIllustration, debtPayoff, cardBreakEven } from './finance.js';
const amount = n => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
export const calculations = {
  'expense-ratio-illustration': () => ({
    headers: ['Years', '0.2% fee (₹)', '1.6% fee (₹)', 'Difference (₹)'],
    rows: expenseIllustration().map(r => [r.years, amount(r.low), amount(r.high), amount(r.difference)]),
    assumptions: '₹10,000 at the start of each month; 12% nominal annual gross return, divided by 12 for monthly compounding, less the stated annual fee. Constant returns; no tax, exit loads, withdrawals or inflation. Illustration, not a forecast.',
  }),
  'debt-repayment-illustration': () => ({
    headers: ['Strategy', 'Months', 'Total interest (money units)'],
    rows: ['avalanche', 'snowball'].map(strategy => {
      const r = debtPayoff([{ balance: 8000, apr: 24, minimum: 200 }, { balance: 2000, apr: 8, minimum: 100 }], 500, strategy);
      return [strategy, r.months, amount(r.interest)];
    }),
    assumptions: 'Hypothetical debts: 8,000 at 24% APR with a 200 minimum, and 2,000 at 8% APR with a 100 minimum. Fixed total monthly budget 500, interest at APR/12, no new charges or fees, freed payments reused. Actual lenders may calculate daily interest and changing minimums.',
  }),
  'card-fee-illustration': () => {
    const r = cardBreakEven({ spend: 18000, fee: 120, feeRate: .04, freeRate: .02 });
    return { headers: ['Annual eligible spend', 'Extra rewards', 'Annual fee', 'Net benefit', 'Break-even spend'], rows: [[18000, r.extraRewards, 120, r.net, r.breakEven]], assumptions: 'Hypothetical money units. Fee card earns 4%, no-fee alternative 2%; no caps, exclusions, interest, other fees or welcome bonuses. Assumes both rates apply to the same spending and all rewards can be redeemed at face value.' };
  },
};
export function calculationTable(id) {
  if (!calculations[id]) throw new Error(`Unknown calculation: ${id}`);
  return calculations[id]();
}
/** Replaces a text marker with a table during rendering, never edits Markdown at build time. */
export function rehypeCalculations() {
  const text = value => ({ type: 'text', value: String(value) });
  const el = (tagName, children, properties = {}) => ({ type: 'element', tagName, properties, children });
  return tree => {
    const walk = node => {
      if (!node.children) return;
      node.children = node.children.flatMap(child => {
        if (child.tagName === 'p' && child.children?.length === 1 && child.children[0].type === 'text') {
          const match = child.children[0].value.trim().match(/^CALCULATION_TABLE:([a-z0-9-]+)$/);
          if (match) {
            const t = calculationTable(match[1]);
            return [el('div', [el('table', [el('thead', [el('tr', t.headers.map(v => el('th', [text(v)], { scope: 'col' })))]), el('tbody', t.rows.map(row => el('tr', row.map(v => el('td', [text(v)])))))])], { className: ['overflow-x-auto'], 'data-calculation': match[1] }), el('p', [el('strong', [text('Assumptions. ')]), text(t.assumptions)])];
          }
        }
        walk(child);
        return [child];
      });
    };
    walk(tree);
  };
}
