import{readdirSync,readFileSync,mkdirSync,writeFileSync}from'node:fs';import{encryptState}from'./lib/state.mjs';
if(!process.env.STATE_ENCRYPTION_KEY)throw new Error('Refusing to upload unencrypted run artifacts');
mkdirSync('automation-artifacts',{recursive:true});
for(const name of readdirSync('automation-runtime').filter(n=>n.endsWith('.json'))){const data=JSON.parse(readFileSync('automation-runtime/'+name,'utf8'));writeFileSync('automation-artifacts/'+name+'.enc',encryptState(data,process.env.STATE_ENCRYPTION_KEY));}
console.log('Run artifacts encrypted before upload.');
