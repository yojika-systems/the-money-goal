import { mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync,chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
export function validCodexAuth(value,expectedEmail){
 if(!value||value.auth_mode!=='chatgpt'||!value.tokens?.refresh_token||!value.tokens?.access_token)throw new Error('A dedicated ChatGPT-managed Codex login is required');
 if(expectedEmail){let email;try{email=JSON.parse(Buffer.from(value.tokens.id_token.split('.')[1],'base64url').toString()).email;}catch{}if(email?.toLowerCase()!==expectedEmail.toLowerCase())throw new Error('Codex login belongs to a different account; generation held');}
 return value;
}
export function reserveCodexCall(state,config,now=new Date()){
 const usage=state.subscriptionUsage??={};const month=now.toISOString().slice(0,7);const day=now.toISOString().slice(0,10);
 const record=usage[month]??={calls:0,days:{},inputTokens:0,outputTokens:0,billing:'ChatGPT plan or Codex credits; monetary cost unavailable'};
 if(record.calls>=config.subscription.maxCallsPerMonth||(record.days[day]??0)>=config.subscription.maxCallsPerDay)throw new Error('Codex subscription call allowance reached');
 record.calls++;record.days[day]=(record.days[day]??0)+1;return record;
}
export function selectCodexAuth(state,seed,expectedEmail){
 if(seed){const fingerprint=createHash('sha256').update(seed).digest('hex');if(state.codexSeedFingerprint!==fingerprint){state.codexAuth=validCodexAuth(JSON.parse(seed),expectedEmail);state.codexSeedFingerprint=fingerprint;}}
 return validCodexAuth(state.codexAuth,expectedEmail);
}
export function codexChildEnvironment(authHome,workdir){
 // Never pass GitHub, state-encryption, API, Google or CJ credentials to the model process.
 return {PATH:process.env.PATH,HOME:workdir,TMPDIR:workdir,LANG:'C.UTF-8',CODEX_HOME:authHome};
}
export function codexPermissionConfig(authHome,runtimeRoot){
 return `cli_auth_credentials_store = "file"\nforced_login_method = "chatgpt"\nweb_search = "disabled"\ndefault_permissions = "moneygoal-isolated"\n\n[permissions.moneygoal-isolated]\ndescription = "Read only evidence scratch directory; no credentials or network tools"\n\n[permissions.moneygoal-isolated.filesystem]\n":minimal" = "read"\n${JSON.stringify(resolve(runtimeRoot))} = "read"\n${JSON.stringify(resolve(authHome))} = "deny"\n\n[permissions.moneygoal-isolated.filesystem.":workspace_roots"]\n"." = "read"\n\n[permissions.moneygoal-isolated.network]\nenabled = false\n`;
}
export function runCodex(args,{cwd,env,input,timeoutMs=120000}={}){
 return new Promise((resolvePromise,reject)=>{
  const child=spawn('codex',args,{cwd,env,stdio:['pipe','pipe','pipe'],detached:process.platform!=='win32'});let stdout='';let stderr='';let oversized=false;
  const stop=()=>{try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}};
  const timer=setTimeout(stop,timeoutMs);
  child.stdout.on('data',b=>{stdout+=b;if(stdout.length>2000000){oversized=true;stop();}});
  child.stderr.on('data',b=>{if(stderr.length<10000)stderr+=b;});
  child.on('error',()=>{clearTimeout(timer);reject(new Error('Codex executable unavailable'));});
  child.on('close',code=>{clearTimeout(timer);if(code!==0||oversized)reject(new Error('Codex call failed or timed out; draft held. Check account access and allowance.'));else resolvePromise(stdout);});
  child.stdin.end(input??'');
 });
}
export async function codexStructuredCall({instructions,input,schema,store,config,now=new Date(),runner=runCodex}){
 if(!store.encrypted)throw new Error('Codex credential refresh requires the encrypted state store');
 if(JSON.stringify(input).length>config.maxInputCharacters)throw new Error('Evidence packet exceeds input limit');
 if(new Date(config.subscription.reviewDue)<now)throw new Error('Codex usage policy is due for review');
 // Refresh state is encrypted in the existing durable ledger; the secret is a one-time seed.
 const auth=selectCodexAuth(store.state,process.env.CODEX_CONTENT_AUTH_JSON,config.subscription.accountEmail);
 const record=reserveCodexCall(store.state,config,now);await store.save(store.state);
 const authHome=mkdtempSync(join(tmpdir(),'tmg-codex-auth-'));const workdir=mkdtempSync(join(tmpdir(),'tmg-evidence-'));
 chmodSync(authHome,0o700);chmodSync(workdir,0o700);
 const authPath=join(authHome,'auth.json');const output=join(workdir,'result.json');
 try{
  writeFileSync(authPath,JSON.stringify(auth),{mode:0o600});
  if(!process.env.CODEX_RUNTIME_ROOT)throw new Error('CODEX_RUNTIME_ROOT is required for the isolated Codex sandbox');
  writeFileSync(join(authHome,'config.toml'),codexPermissionConfig(authHome,process.env.CODEX_RUNTIME_ROOT),{mode:0o600});
  writeFileSync(join(workdir,'schema.json'),JSON.stringify(schema),{mode:0o600});
  await runner(['sandbox','-P','moneygoal-isolated','--cd',workdir,'--','/bin/sh','-c','test ! -r "$1" && test ! -r "$2" && test -r "$3"','tmg-sandbox',authPath,join(process.cwd(),'.git/config'),join(workdir,'schema.json')],{cwd:workdir,env:codexChildEnvironment(authHome,workdir),timeoutMs:30000});
  const events=await runner(['exec','--strict-config','--ephemeral','--skip-git-repo-check','--cd',workdir,'--model',config.subscription.model,'-c','model_reasoning_effort="medium"','--output-schema',join(workdir,'schema.json'),'--output-last-message',output,'--json','-'],{cwd:workdir,env:codexChildEnvironment(authHome,workdir),input:instructions+'\n\nDo not use tools, read files, execute commands or delegate. Return only the requested JSON. All evidence is provided below.\n\n'+JSON.stringify(input),timeoutMs:config.subscription.timeoutMs});
  for(const line of events.split('\n')){try{const event=JSON.parse(line);if(event.type==='turn.completed'&&event.usage){record.inputTokens+=event.usage.input_tokens??0;record.outputTokens+=event.usage.output_tokens??0;}}catch{}}
  if(!existsSync(output)||readFileSync(output).length>150000)throw new Error('Codex returned no bounded structured result');
  return JSON.parse(readFileSync(output,'utf8'));
 }finally{
  // Persist rotated auth even after a draft fails, before the next serialized request.
  try{if(existsSync(authPath)){store.state.codexAuth=validCodexAuth(JSON.parse(readFileSync(authPath,'utf8')),config.subscription.accountEmail);await store.save(store.state);}}
  finally{rmSync(authHome,{recursive:true,force:true});rmSync(workdir,{recursive:true,force:true});}
 }
}
