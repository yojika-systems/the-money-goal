import{readFileSync,existsSync}from'node:fs';import{homedir}from'node:os';import{join}from'node:path';import{decryptState}from'./lib/state.mjs';import{redactCredentials}from'./lib/owner-backup.mjs';
const backup=join(homedir(),'.config/themoneygoal/state-encryption-key');
const key=process.env.STATE_ENCRYPTION_KEY?.trim()||(existsSync(backup)?readFileSync(backup,'utf8').trim():null);
if(!process.argv[2]||!key)throw new Error('Provide a downloaded .enc path and configure the owner key backup or STATE_ENCRYPTION_KEY');
console.log(JSON.stringify(redactCredentials(decryptState(readFileSync(process.argv[2],'utf8'),key)),null,2));
