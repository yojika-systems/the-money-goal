import {execFileSync}from'node:child_process';import{stateStore,weekKey}from'./lib/state.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(process.env.CI!=='true')throw new Error('Maintenance commits require CI');
const changed=git('diff','--name-only').split('\n').filter(Boolean);if(!changed.length)process.exit(0);
if(changed.length!==1||changed[0]!=='src/data/offers.json')throw new Error('Maintenance may only suspend recorded offers');
const before=JSON.parse(git('show','HEAD:src/data/offers.json'));const after=JSON.parse(execFileSync('cat',['src/data/offers.json'],{encoding:'utf8'}));
if(before.length!==after.length)throw new Error('Maintenance cannot add offers');
for(let i=0;i<before.length;i++){const a=structuredClone(before[i]),b=structuredClone(after[i]);delete a.status;delete b.status;delete a.notes;delete b.notes;if(JSON.stringify(a)!==JSON.stringify(b)||after[i].status!==before[i].status&&after[i].status!=='suspended')throw new Error('Maintenance cannot activate or rewrite an offer');}
const store=await stateStore();if(store.state.pendingPublication)throw new Error('Deployment recovery is pending');const base=git('rev-parse','HEAD');git('fetch','origin','main');if(git('rev-parse','origin/main')!==base)throw new Error('Main moved; retry from current main');
git('config','user.name','MoneyGoal publisher');git('config','user.email','publisher@users.noreply.github.com');git('add','src/data/offers.json');git('commit','-m','maintenance: hold unavailable provider links');const sha=git('rev-parse','HEAD');
store.state.pendingPublication={id:'provider-maintenance-'+sha,sha,base,path:'/api/health',file:'src/data/offers.json',kind:'maintenance',week:weekKey(),date:new Date().toISOString().slice(0,10),status:'pending'};await store.save(store.state);git('push','origin',`${sha}:refs/heads/main`);
