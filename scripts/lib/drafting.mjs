import { normalize, validateArticle } from './content.mjs';
import { TOPICS } from '../../src/lib/publication.js';
import { evidenceOptions } from './editorial.mjs';
export function assembleDraft(draft,candidate,documents,runId,now=new Date(),options=evidenceOptions(documents,candidate)){
 if(!draft||!Array.isArray(draft.sections)||draft.sections.length<3||draft.sections.length>8||!Array.isArray(draft.evidence)||!draft.evidence.length)throw new Error('Insufficient draft structure or evidence');
 const resolvedEvidence=draft.evidence.map(e=>{const option=options.find(p=>p.id===e.passageId);if(!option)throw new Error('Unknown source passage identifier');return {id:e.id,claim:e.claim,sourceId:option.sourceId,excerpt:option.excerpt};});
 const ids=new Set();const wordsBySource={};
 for(const e of resolvedEvidence){
  if(!/^[a-z0-9-]{1,40}$/.test(e.id)||ids.has(e.id))throw new Error('Invalid evidence identifiers');ids.add(e.id);
  const doc=documents.find(d=>d.id===e.sourceId);
  if(!doc||!normalize(doc.text).includes(normalize(e.excerpt))||normalize(e.excerpt).length<15)throw new Error('Evidence excerpt absent from original source');
  wordsBySource[e.sourceId]=(wordsBySource[e.sourceId]??0)+e.excerpt.trim().split(/\s+/).length;
  if(wordsBySource[e.sourceId]>25)throw new Error('Quoted source excerpt allowance exceeded');
 }
 const numeric=text=>String(text).match(/\d+(?:[.,]\d+)*/g)??[];
 const plain=text=>{if(typeof text!=='string'||text.length>2000||/[<>`\[\]{}]|https?:|javascript:/i.test(text))throw new Error('Draft must contain plain text only');return text.replace(/^\s*#+\s*/gm,'').trim();};
 const sections=draft.sections.map(s=>{
  const heading=plain(s.heading);if(!heading||numeric(heading).length)throw new Error('Invalid or unsourced numeric heading');
  if(!Array.isArray(s.paragraphs)||!s.paragraphs.length)throw new Error('Empty section');
  const paragraphs=s.paragraphs.map(p=>{
   const text=plain(p.text);if(text.length<30||!Array.isArray(p.evidenceIds)||!p.evidenceIds.length)throw new Error('Each paragraph needs evidence');
   const evidence=p.evidenceIds.map(id=>{if(!ids.has(id))throw new Error('Paragraph references missing evidence');return resolvedEvidence.find(e=>e.id===id);});
   const allowed=new Set(evidence.flatMap(e=>numeric(e.excerpt)));
   if(numeric(text).some(n=>!allowed.has(n)))throw new Error('Numeric claim lacks evidence');
   return `${text} ${[...new Set(evidence.map(e=>e.sourceId))].map(id=>`[Source](#source-${id})`).join(' ')}`;
  });return `## ${heading}\n\n${paragraphs.join('\n\n')}`;
 });
 if(numeric(draft.title).length||numeric(draft.description).length)throw new Error('Numeric title or description requires editorial review');
 const refs=candidate.calculationRefs??[];
 let body=sections.join('\n\n');
 if(refs.length)body+=`\n\n## Explore the assumptions\n\n${refs.map(id=>`CALCULATION_TABLE:${id}`).join('\n\n')}\n\n[Change the inputs in our calculators](/calculators). These scenarios do not predict future outcomes.`;
 const date=now.toISOString().slice(0,10);
 const data={title:plain(draft.title),description:plain(draft.description),pubDate:date,author:'The MoneyGoal editorial system',category:TOPICS.find(t=>t.id===candidate.topic)?.name??'Economy & policy',topic:candidate.topic,tags:[],lang:'en',translationKey:candidate.id,market:candidate.market,contentType:candidate.contentType,aiAssisted:true,automationRunId:runId,draft:true,reviewDue:new Date(now.getTime()+(candidate.contentType==='news'?30:90)*86400000).toISOString().slice(0,10),offerIds:[],affiliate:false,calculationRefs:refs,sources:documents.map(d=>({id:d.id,title:d.title,publisher:d.publisher,url:d.url,accessed:d.accessed,...(candidate.published?{published:candidate.published.slice(0,10)}:{})})),evidence:resolvedEvidence,verification:{status:'draft',checkedAt:date,method:'Source retrieval, independent model challenge and deterministic validation',reasons:[]}};
 const errors=validateArticle(data,body,{now,documents});if(errors.length)throw new Error(errors.join('; '));
 return {data,body,documents};
}
export function assertVerified(result){
 if(!result||result.supported!==true||result.allMaterialClaimsCovered!==true||result.countryConsistent!==true||result.originalContribution!==true||result.personalisedAdvice!==false||result.inventedExperience!==false||!Array.isArray(result.conflicts)||result.conflicts.length||!Array.isArray(result.unsupportedClaims)||result.unsupportedClaims.length)throw new Error('Independent verification held the article');
}
