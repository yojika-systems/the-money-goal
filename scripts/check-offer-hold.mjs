/** Exercise the rendered no-offer state; restore registry bytes even if the build fails. */
import{readFileSync,writeFileSync,readdirSync,statSync}from'node:fs';import{join}from'node:path';import{execFileSync}from'node:child_process';
const file='src/data/offers.json';const before=readFileSync(file);
function assertNoPaidLinks(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())assertNoPaidLinks(path);else if(name.endsWith('.html')&&/\bdata-offer=/.test(readFileSync(path,'utf8')))throw new Error('A held paid offer is still visible');}}
try{
 const offers=JSON.parse(before);for(const offer of offers)if(offer.status==='active')offer.status='suspended';writeFileSync(file,JSON.stringify(offers));
 try{execFileSync('npm',['run','verify'],{stdio:'pipe'});}catch(error){throw new Error('The held-offer build failed: '+String(error.stderr??error.stdout??'').slice(-2000));}
 assertNoPaidLinks('dist');console.log('Held-offer build passed: no paid placements rendered; registry restored.');
}finally{writeFileSync(file,before);}
