import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync,readFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { reserveCodexCall,codexChildEnvironment,codexStructuredCall,validCodexAuth } from '../scripts/lib/codex.mjs';
const config={maxInputCharacters:48000,subscription:{model:'gpt-6.1-sol',maxCallsPerDay:4,maxCallsPerMonth:100,timeoutMs:1000,reviewDue:'2026-12-17'}};
const now=new Date('2026-11-17T10:00:00Z');
const fakeAuth={auth_mode:'chatgpt',tokens:{refresh_token:'test-only-refresh',access_token:'test-only-access'}};
test('subscription allowances reserve failed attempts and stop at daily/monthly caps',()=>{
 const state={};for(let i=0;i<4;i++)reserveCodexCall(state,config,now);assert.throws(()=>reserveCodexCall(state,config,now));
 state.subscriptionUsage['2026-11'].calls=100;assert.throws(()=>reserveCodexCall(state,config,new Date('2026-11-18T10:00:00Z')));
});
test('the model child cannot inherit publishing or encryption secrets',()=>{
 process.env.GITHUB_TOKEN='test-only';process.env.STATE_ENCRYPTION_KEY='test-only';process.env.OPENAI_API_KEY='test-only';
 const env=codexChildEnvironment('/tmp/auth','/tmp/evidence');for(const key of ['GITHUB_TOKEN','STATE_ENCRYPTION_KEY','OPENAI_API_KEY','CJ_API_TOKEN','CODEX_CONTENT_AUTH_JSON'])assert.equal(env[key],undefined);
});
test('Codex refuses API credentials and any plaintext ledger',async()=>{
 assert.throws(()=>validCodexAuth({auth_mode:'apikey',OPENAI_API_KEY:'test-only'}));
 await assert.rejects(codexStructuredCall({instructions:'test',input:{},schema:{},store:{state:{}},config,now}),/encrypted/);
});
test('refreshed login survives a failed call and temporary credentials are removed',async()=>{
 process.env.CODEX_RUNTIME_ROOT='/tmp/test-runtime';const store={encrypted:true,state:{codexAuth:fakeAuth},save:async()=>{}};let authHome;
 await assert.rejects(codexStructuredCall({instructions:'test',input:{},schema:{},store,config,now,runner:async(args,options)=>{
  authHome=options.env.CODEX_HOME;
  if(args[0]==='sandbox')return '';
  const auth=JSON.parse(readFileSync(join(authHome,'auth.json')));auth.tokens.refresh_token='test-only-rotated';writeFileSync(join(authHome,'auth.json'),JSON.stringify(auth));throw new Error('simulated timeout');
 }}),/simulated/);
 assert.equal(store.state.codexAuth.tokens.refresh_token,'test-only-rotated');assert.equal(existsSync(authHome),false);
});
test('Codex returns schema output and records usage without API price assumptions',async()=>{
 process.env.CODEX_RUNTIME_ROOT='/tmp/test-runtime';const store={encrypted:true,state:{codexAuth:fakeAuth},save:async()=>{}};
 const result=await codexStructuredCall({instructions:'test',input:{},schema:{},store,config,now,runner:async(args)=>{
  if(args[0]==='sandbox')return '';
  writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({supported:true}));
  return JSON.stringify({type:'turn.completed',usage:{input_tokens:10,output_tokens:5}});
 }});
 assert.deepEqual(result,{supported:true});assert.equal(store.state.subscriptionUsage['2026-11'].inputTokens,10);assert.equal(store.state.subscriptionUsage['2026-11'].spentInr,undefined);
});
