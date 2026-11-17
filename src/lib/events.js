const tools = new Set(['expense-ratio','debt-payoff','card-fee','sip','financial-health']);
const pages = new Set(['/','/partner','/calculators','/mutual-funds','/financial-health','/calculators/expense-ratio','/calculators/debt-payoff','/calculators/card-fee']);
export function validateEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['event','page','tool','offer','placement','market'].includes(k))) return null;
  if (!['tool_completion','affiliate_click'].includes(input.event) || !pages.has(input.page)) return null;
  if (input.event === 'tool_completion' && (!tools.has(input.tool) || input.offer)) return null;
  if (input.event === 'affiliate_click' && (input.offer !== 'alice-blue' || !['/','/partner'].includes(input.page) || input.market !== 'IN')) return null;
  for (const key of ['tool','offer','placement','market']) if (input[key] !== undefined && (typeof input[key] !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(input[key]))) return null;
  return { event:input.event, page:input.page, tool:input.tool??'', offer:input.offer??'', placement:input.placement??'', market:input.market??'global' };
}
