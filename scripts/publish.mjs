import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stateStore,weekKey } from './lib/state.mjs';
import { postHref } from '../src/lib/publication.js';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const store=await stateStore();
const pending=JSON.parse(readFileSync('automation-runtime/pending.json','utf8'));
if(process.env.CI!=='true'||pending.mode!=='live'||pending.data.verification.status!=='verified')throw new Error('Live publishing requires CI and a verified live package');
if(store.state.pendingPublication)throw new Error('Previous deployment recovery is pending');
if(store.state.published.some(p=>p.id===pending.candidate.id&&p.status==='published'&&!pending.candidate.refresh))throw new Error('Already published');
const paths=[...git('diff','--name-only').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean);
if(!paths.length||paths.some(path=>path!==pending.file))throw new Error('Publishing bot can change only the selected Markdown article');
const base=git('rev-parse','HEAD');
git('fetch','origin','main');if(git('rev-parse','origin/main')!==base)throw new Error('Main moved during validation; re-run from current main');
git('config','user.name','MoneyGoal publisher');git('config','user.email','publisher@users.noreply.github.com');
git('add','--',pending.file);git('commit','-m',`content: ${pending.data.title}`);const sha=git('rev-parse','HEAD');
const post={slug:pending.candidate.id,data:pending.data};const path=postHref(post);
const release={id:pending.candidate.id,sha,base,path,file:pending.file,digest:createHash('sha256').update(pending.body.trim()).digest('hex'),signature:pending.signature,kind:pending.candidate.refresh?'refresh':pending.candidate.contentType,week:weekKey(),date:new Date().toISOString().slice(0,10),status:'pending'};
store.state.pendingPublication=release;await store.save(store.state);
try{git('push','origin',`${sha}:refs/heads/main`);}catch(error){
 // A network failure is ambiguous. Inspect the remote before releasing the ledger lock.
 try{git('fetch','origin','main');if(git('rev-parse','origin/main')!==sha){store.state.pendingPublication=null;await store.save(store.state);}}catch{}
 throw error;
}
console.log(`Published content commit ${sha}; monitoring ${path}.`);
