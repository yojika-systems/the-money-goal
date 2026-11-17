/** Allowlisted metadata only. Never serialize form fields, query strings or results. */
import { validateEvent } from './events.js';
import { hasMeasurementConsent,sendGoogleEvent } from './analytics.js';
export function track(event, metadata = {}) {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl || !['tool_completion', 'affiliate_click'].includes(event)) return;
  try{if(!hasMeasurementConsent(navigator,window.localStorage))return;}catch{return;}
  const allowed = {};
  for (const key of ['tool','offer','placement','market']) {
    if (typeof metadata[key] === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(metadata[key])) allowed[key] = metadata[key];
  }
  const input={event,page:window.location.pathname,...allowed};if(!validateEvent(input))return;
  sendGoogleEvent(input);
  const payload=JSON.stringify(input);
  fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,credentials:'omit',keepalive:true}).catch(()=>{});
}
