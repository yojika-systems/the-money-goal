import{mkdirSync,writeFileSync}from'node:fs';import{encryptStateKey}from'./lib/owner-backup.mjs';
const encrypted=encryptStateKey(process.env.STATE_ENCRYPTION_KEY,process.env.OWNER_PUBLIC_KEY);
mkdirSync('owner-backup',{recursive:true});writeFileSync('owner-backup/state-key.enc',encrypted,{mode:0o600});
console.log('Owner-encrypted recovery artifact created.');
