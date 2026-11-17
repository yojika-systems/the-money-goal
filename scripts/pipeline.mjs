import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import { articleFiles,readArticle,serializeArticle,normalize } from './lib/content.mjs';
import { fetchAllowed,collectDocument,parseFeed } from './lib/network.mjs';
import { stateStore,underWeeklyLimit,shadowReady,hasPublishedArticleToday } from './lib/state.mjs';
import { structuredCall,draftSchema,verificationSchema,writerInstructions,verifierInstructions } from './lib/model.mjs';
import { assembleDraft,assertVerified } from './lib/drafting.mjs';
import { evidenceOptions,candidateQueue } from './lib/editorial.mjs';
import { hasCodexCapacity } from './lib/codex.mjs';
const config=JSON.parse(readFileSync('automation/config.json','utf8'));
const sources=JSON.parse(readFileSync('automation/sources.json','utf8'));
const backlog=JSON.parse(readFileSync('automation/backlog.json','utf8'));
mkdirSync('automation-runtime',{recursive:true});
const offline=process.argv.includes('--offline');
const store=await stateStore(offline?{token:null,repo:null}:{});const state=store.state;
const runId=process.env.GITHUB_RUN_ID??randomUUID();const now=new Date();const day=now.toISOString().slice(0,10);
const report={runId,at:now.toISOString(),mode:'held',holds:[],sources:[],candidate:null};
const hold=(id,reason)=>{report.holds.push({id,reason});state.holds.push({id,reason,at:now.toISOString()});};
const fingerprint=text=>createHash('sha256').update(normalize(text)).digest('hex');
const corpus=articleFiles().map(file=>readArticle(file));
const existingKeys=new Set(corpus.map(p=>`${p.data.market}:${p.data.translationKey}`));
const existingTitles=new Set(corpus.map(p=>normalize(p.data.title)));
try{
 // Maintenance and source checks continue without generation credentials.
 const news=[];
 for(const source of sources.filter(s=>s.feed)){
  if(offline){report.sources.push({id:source.id,status:'offline-check-skipped'});continue;}
  try{const feed=await fetchAllowed(source.feed,sources);news.push(...parseFeed(feed.body,source,now).filter(c=>now-new Date(c.published)<=config.newsMaxAgeDays*86400000));state.sourceChecks[source.id]={checkedAt:now.toISOString(),status:'ok'};report.sources.push({id:source.id,status:'ok'});}
  catch(error){state.sourceChecks[source.id]={checkedAt:now.toISOString(),status:'held',reason:error.message};report.sources.push({id:source.id,status:'held',reason:error.message});}
 }
 const due=corpus.filter(p=>new Date(p.data.reviewDue)<=now);
 report.dueReviews=due.map(p=>({key:p.data.translationKey,market:p.data.market}));
 if(state.pendingPublication)throw new Error('A previous publication needs deployment recovery before drafting');
 if(!config.enabled)throw new Error('Generation kill switch is off');
 if(process.env.GENERATION_PAUSED==='true')throw new Error('Generation is paused by the repository variable; maintenance continues without model calls');
 if(offline)throw new Error('Offline dry run: no model calls or publication');
 const provider=process.env.AI_PROVIDER??config.provider;
 if(provider==='codex'&&!state.codexAuth&&!process.env.CODEX_CONTENT_AUTH_JSON)throw new Error('Dedicated Codex subscription login is not configured; generation held');
 if(provider==='openai-api'&&!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is not configured; no paid requests made');
 const refreshes=due.map(p=>({id:p.data.translationKey,title:p.data.title,topic:p.data.topic,market:p.data.market,contentType:p.data.contentType,refresh:true,file:p.file,original:p.data,sources:p.data.sources.map(s=>s.url),calculationRefs:p.data.calculationRefs,readerDecision:'Recheck the existing explanation against current primary documents and preserve its reader decision'}));
 const candidates=candidateQueue(refreshes,backlog.filter(c=>['editorial','validated'].includes(c.research?.status)),news);
 const publicationToday=hasPublishedArticleToday(state,day);
 if(publicationToday)throw new Error('Daily publication already completed');
 for(const candidate of candidates){
  if(report.holds.length>=config.maxCandidatesPerRun)break;
  if((!candidate.refresh&&(existingKeys.has(`${candidate.market}:${candidate.id}`)||existingTitles.has(normalize(candidate.title))||state.seen[candidate.id]?.status==='published'))||config.pausedTopics.includes(candidate.topic)||!config.autoPublishMarkets.includes(candidate.market)||!underWeeklyLimit(state,config,candidate.refresh?'refresh':candidate.contentType,now))continue;
  const previous=state.seen[candidate.id];
  if(previous?.attemptedAt?.slice(0,10)===day)continue;
  if(provider==='codex'&&!hasCodexCapacity(state,config,2,now)){hold('run','Codex allowance must have room for both drafting and independent verification');break;}
  try{
   state.seen[candidate.id]={status:'attempting',attemptedAt:now.toISOString()};await store.save(state);
   if(!candidate.sources?.length)throw new Error('No approved exact source documents');
   const documents=[];for(const url of candidate.sources.slice(0,3))documents.push(await collectDocument(url,sources));
   if(!documents.some(d=>d.primary))throw new Error('No primary document');
   // Source fingerprints also prevent the same release producing a second article.
   const signature=fingerprint(documents.map(d=>d.fingerprint).sort().join(':')+candidate.readerDecision);
   if(!candidate.refresh&&state.published.some(p=>p.signature===signature))throw new Error('Duplicate source and reader-decision fingerprint');
   const promptDocuments=documents.map(d=>({...d,text:d.text.slice(0,Math.min(12000,Math.floor(24000/documents.length)))}));
   const options=evidenceOptions(promptDocuments,candidate);
   const packet={candidate,documents:promptDocuments,evidenceOptions:options,existingPages:corpus.map(p=>({title:p.data.title,key:p.data.translationKey,market:p.data.market})),registeredCalculations:candidate.calculationRefs};
   const draft=await structuredCall({instructions:writerInstructions,input:packet,schema:draftSchema,name:'financial_explainer',store,config});
   const pending=assembleDraft(draft,candidate,documents,String(runId),now,options);
   const verdict=await structuredCall({instructions:verifierInstructions,input:{candidate,article:{data:pending.data,body:pending.body},documents:promptDocuments},schema:verificationSchema,name:'source_verification',store,config});
   assertVerified(verdict);
   if(verdict.effectiveDate){if(!Number.isFinite(Date.parse(verdict.effectiveDate)))throw new Error('Unparseable effective date');const target=new Date(verdict.effectiveDate);const variants=[verdict.effectiveDate,target.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}),target.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})].map(v=>normalize(v).replace(/[,]/g,''));if(!documents.some(d=>variants.some(v=>normalize(d.text).replace(/[,]/g,'').includes(v))))throw new Error('Effective date needs explicit source normalization');pending.data.sources[0].effective=verdict.effectiveDate;}
   if(candidate.refresh){pending.data.pubDate=candidate.original.pubDate;pending.data.updatedDate=day;pending.data.legacyUrl=candidate.original.legacyUrl??false;}
   pending.data.verification.status='verified';pending.verdict=verdict;pending.candidate=candidate;pending.signature=signature;pending.runId=String(runId);
   pending.mode=config.mode==='shadow'||!shadowReady(state,config)?'shadow':'live';
   report.mode=pending.mode;report.candidate={id:candidate.id,market:candidate.market};
   writeFileSync('automation-runtime/pending.json',JSON.stringify(pending,null,2));
   { // Build shadow drafts too, but the shadow workflow never commits them.
    pending.data.draft=false;
    const relative=candidate.file??`src/content/blog/${candidate.market==='global'?'':candidate.market.toLowerCase()+'/'}${candidate.id}.md`;
    if(!/^src\/content\/blog\/(?:in\/|us\/)?[a-z0-9-]+\.md$/.test(relative))throw new Error('Invalid content destination');
    mkdirSync(join(relative,'..'),{recursive:true});writeFileSync(relative,serializeArticle(pending.data,pending.body));pending.file=relative;
    writeFileSync('automation-runtime/pending.json',JSON.stringify(pending,null,2));
   }
   break;
  }catch(error){hold(candidate.id,error.message);state.seen[candidate.id]={status:'held',attemptedAt:now.toISOString(),reason:error.message};}
 }
 if(!report.candidate&&!report.holds.length)hold('queue','No eligible, researched, non-duplicate candidate with available weekly capacity');
}catch(error){hold('run',error.message);}
state.runs.push({id:String(runId),at:now.toISOString(),mode:report.mode,candidate:report.candidate?.id??null});state.runs=state.runs.slice(-180);state.holds=state.holds.slice(-250);
await store.save(state);
writeFileSync('automation-runtime/report.json',JSON.stringify(report,null,2));
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`mode=${report.mode}\n`);
const summary=`## MoneyGoal publication run\n\nMode: **${report.mode}**\n\n${report.holds.map(h=>`- ${h.id}: ${h.reason}`).join('\n')}\n\nSource checks: ${report.sources.filter(s=>s.status==='ok').length}/${report.sources.length}.\nNo skipped or held draft is published.\n`;
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(summary);
