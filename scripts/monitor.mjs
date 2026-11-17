import { execFileSync } from 'node:child_process';
import { deploymentDecision,guardedRollback } from './lib/releases.mjs';
import { stateStore } from './lib/state.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const store=await stateStore();const release=store.state.pendingPublication;
if(!release){console.log('No publication needs deployment recovery.');process.exit(0);}
const repo=process.env.GITHUB_REPOSITORY;const token=process.env.GITHUB_TOKEN;
const request=async path=>{const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error(`Deployment status HTTP ${r.status}`);return r.json();};
// Confirm the recorded commit exists on main. Never rollback an ambiguous failed push.
git('fetch','origin','main');let head=git('rev-parse','origin/main');
if(head!==release.sha){
 try{git('merge-base','--is-ancestor',release.sha,'origin/main');}catch{store.state.pendingPublication=null;await store.save(store.state);console.log('Publication commit did not reach main; lock cleared.');process.exit(0);}
}
let failure=false,verified=false;
for(let attempt=0;attempt<30;attempt++){
 const checks=await request(`/commits/${release.sha}/check-runs`);
 const deployment=checks.check_runs?.find(c=>c.name==='Cloudflare Pages');
 if(['rollback','hold-newer-work'].includes(deploymentDecision({release,head,check:deployment}))){failure=true;break;}
 if(deployment?.conclusion==='success'){
  // Require deployment success and exact rendered article body digest.
  try{const r=await fetch(`https://themoneygoal.com${release.path}?release=${release.sha}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});const html=await r.text();if(r.ok&&(release.kind==='maintenance'?JSON.parse(html).status==='ok':html.includes(`name="content-digest" content="${release.digest}"`))){verified=true;break;}}catch{}
 }
 if(attempt<29)await new Promise(r=>setTimeout(r,15000));
}
if(verified){
 store.state.published.push({...release,status:'published'});store.state.seen[release.id]={status:'published',at:new Date().toISOString(),sha:release.sha};store.state.pendingPublication=null;await store.save(store.state);console.log(`Verified live publication: https://themoneygoal.com${release.path}`);process.exit(0);
}
// A timeout may be a delayed deployment. Leave it pending for next run, never undo it blindly.
if(!failure)throw new Error('Deployment or live digest is not confirmed; publication remains locked for next-run recovery');
const rollback=guardedRollback(release.sha,git);
store.state.published.push({...release,status:'rolled-back',rollback});store.state.seen[release.id]={status:'held',reason:'Deployment failed and was reverted',attemptedAt:new Date().toISOString()};store.state.pendingPublication=null;await store.save(store.state);
throw new Error(`Failed deployment reverted by ${rollback}; inspect the hosting check before republishing`);
