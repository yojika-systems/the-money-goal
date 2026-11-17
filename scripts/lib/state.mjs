import { randomBytes,createCipheriv,createDecipheriv } from 'node:crypto';
import { existsSync,readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function encryptState(state,key){const bytes=Buffer.from(key??'','hex');if(bytes.length!==32)throw new Error('STATE_ENCRYPTION_KEY must contain 32 bytes in hex');const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',bytes,iv);const ciphertext=Buffer.concat([cipher.update(JSON.stringify(state),'utf8'),cipher.final()]);return JSON.stringify({version:1,iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('base64')});}
export function decryptState(value,key){const record=JSON.parse(value);if(record.version!==1)throw new Error('Unsupported state format');const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key??'','hex'),Buffer.from(record.iv,'hex'));decipher.setAuthTag(Buffer.from(record.tag,'hex'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(record.ciphertext,'base64')),decipher.final()]).toString('utf8'));}
export const emptyState=()=>({version:1,runs:[],seen:{},monthly:{},published:[],shadowDays:[],holds:[],sourceChecks:{},pendingPublication:null});
export async function stateStore({token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY,localPath='automation-runtime/state.json',fetcher=fetch}={}){
 let sha;const branch='automation-state';const root=repo?`https://api.github.com/repos/${repo}`:null;
 const request=async(path,method='GET',body)=>{
  const response=await fetcher(root+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
  if(!response.ok){const error=new Error(`State store HTTP ${response.status}`);error.status=response.status;throw error;}return response.json();
 };
 if(token&&repo){
  const encryptionKey=process.env.STATE_ENCRYPTION_KEY;if(!encryptionKey)throw new Error('STATE_ENCRYPTION_KEY is not configured');
  try{const file=await request(`/contents/state.enc?ref=${branch}`);sha=file.sha;return {encrypted:true,state:decryptState(Buffer.from(file.content,'base64').toString(),encryptionKey),save:async state=>{const next=await request('/contents/state.enc','PUT',{message:'[skip ci] [CF-Pages-Skip] Publication state checkpoint',content:Buffer.from(encryptState(state,encryptionKey)).toString('base64'),branch,sha});sha=next.content.sha;}};}
  catch(error){if(error.status!==404)throw error;}
  try{await request(`/git/ref/heads/${branch}`);}catch(error){if(error.status!==404)throw error;const main=await request('/git/ref/heads/main');try{await request('/git/refs','POST',{ref:`refs/heads/${branch}`,sha:main.object.sha});}catch(e){if(e.status!==422)throw e;}}
  return {encrypted:true,state:emptyState(),save:async state=>{const next=await request('/contents/state.enc','PUT',{message:'[skip ci] [CF-Pages-Skip] Publication state checkpoint',content:Buffer.from(encryptState(state,encryptionKey)).toString('base64'),branch,...(sha?{sha}:{})});sha=next.content.sha;}};
 }
 mkdirSync(dirname(localPath),{recursive:true});
 return {state:existsSync(localPath)?JSON.parse(readFileSync(localPath,'utf8')):emptyState(),save:async state=>writeFileSync(localPath,JSON.stringify(state,null,2))};
}
export function reserveCost(state,config,id,maxInr,now=new Date()){
 const month=now.toISOString().slice(0,7);const record=state.monthly[month]??={spentInr:0,reservations:{}};
 const reserved=Object.values(record.reservations).reduce((n,v)=>n+v,0);
 if(record.spentInr+reserved+maxInr>config.aiMonthlyLimitInr||record.spentInr+reserved+maxInr+config.nonAiReserveInr>config.totalMonthlyLimitInr)throw new Error('Monthly generation budget reached');
 if(record.reservations[id])throw new Error('Duplicate cost reservation');record.reservations[id]=maxInr;return month;
}
export function settleCost(state,month,id,actual){const record=state.monthly[month];const reserved=record.reservations[id];if(!Number.isFinite(reserved))throw new Error('Reservation missing');if(!Number.isFinite(actual)||actual<0)throw new Error('Invalid cost');record.spentInr+=actual;delete record.reservations[id];}
export function shadowReady(state,config){return new Set(state.shadowDays).size>=config.shadowDays;}
export function hasPublishedArticleToday(state,day){return state.published.some(p=>p.date===day&&p.status==='published'&&p.kind!=='maintenance');}
export function weekKey(date=new Date()){const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const year=new Date(Date.UTC(d.getUTCFullYear(),0,1));return `${d.getUTCFullYear()}-W${Math.ceil((((d-year)/86400000)+1)/7)}`;}
export function underWeeklyLimit(state,config,kind,now=new Date()){return state.published.filter(p=>p.week===weekKey(now)&&p.kind===kind&&p.status!=='rolled-back').length<(config.weeklyLimits[kind]??0);}
