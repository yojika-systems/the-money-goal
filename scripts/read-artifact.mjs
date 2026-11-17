import{readFileSync}from'node:fs';import{decryptState}from'./lib/state.mjs';
if(!process.argv[2]||!process.env.STATE_ENCRYPTION_KEY)throw new Error('Provide a downloaded .enc path and STATE_ENCRYPTION_KEY in the environment');
console.log(JSON.stringify(decryptState(readFileSync(process.argv[2],'utf8'),process.env.STATE_ENCRYPTION_KEY),null,2));
