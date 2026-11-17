import { readFileSync } from 'node:fs';
import { stateStore } from './lib/state.mjs';
const pending=JSON.parse(readFileSync('automation-runtime/pending.json','utf8'));
if(pending.mode!=='shadow')throw new Error('Only a fully built shadow draft can count');
const store=await stateStore();const day=new Date().toISOString().slice(0,10);
store.state.shadowDays=[...new Set([...store.state.shadowDays,day])].sort();
store.state.seen[pending.candidate.id]={status:'shadow-passed',attemptedAt:new Date().toISOString()};
await store.save(store.state);
console.log(`Shadow validation recorded for ${day}. ${store.state.shadowDays.length} distinct days passed.`);
