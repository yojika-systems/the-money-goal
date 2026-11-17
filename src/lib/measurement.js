/** Allowlisted metadata only. Never serialize form fields, query strings or results. */
export function track(event, metadata = {}) {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl || !['tool_completion', 'affiliate_click'].includes(event)) return;
  const allowed = {};
  for (const key of ['tool','offer','placement','market']) {
    if (typeof metadata[key] === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(metadata[key])) allowed[key] = metadata[key];
  }
  const payload=JSON.stringify({event,page:window.location.pathname,...allowed});
  fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,credentials:'omit',keepalive:true}).catch(()=>{});
}
