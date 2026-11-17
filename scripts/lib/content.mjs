import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { marked } from 'marked';
import { calculations } from '../../src/lib/calculations.js';
import { MARKETS, TOPICS } from '../../src/lib/publication.js';
export const normalize = value => String(value).replace(/\s+/g,' ').trim().toLowerCase();
export function readArticle(file) {
 const raw=readFileSync(file,'utf8');const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!m)throw new Error(`Missing frontmatter: ${file}`);
 return {data:parse(m[1]),body:m[2],file};
}
export function articleFiles(dir='src/content/blog') {
 return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?articleFiles(join(dir,e.name)):e.name.endsWith('.md')?[join(dir,e.name)]:[]);
}
export function validateArticle(data, body, {now=new Date(), documents=null}={}) {
 const errors=[];
 if(!data.title||data.title.length>70)errors.push('Invalid title');
 if(!data.description||data.description.length<80||data.description.length>170)errors.push('Description must contain 80–170 characters');
 if(!Object.keys(MARKETS).includes(data.market))errors.push('Invalid market');
 if(!TOPICS.some(t=>t.id===data.topic))errors.push('Invalid topic');
 if(!['evergreen','news','comparison'].includes(data.contentType))errors.push('Invalid article type');
 if(data.lang!=='en')errors.push('Automatic translation is paused');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.translationKey??''))errors.push('Invalid translation key');
 if(!data.reviewDue||!Number.isFinite(Date.parse(data.reviewDue)))errors.push('Missing review deadline');
 if(!data.pubDate||!Number.isFinite(Date.parse(data.pubDate))||new Date(data.pubDate)>now)errors.push('Invalid publication date');
 if(!data.verification||!['verified','held','draft'].includes(data.verification.status))errors.push('Missing verification state');
 if(data.verification?.status==='verified' && (data.verification.reasons?.length || !data.verification.checkedAt || !data.verification.method))errors.push('Invalid verified record');
 if(data.draft===false&&data.verification?.status!=='verified')errors.push('Unverified article cannot be published');
 if(data.aiAssisted && data.author!=='The MoneyGoal editorial system')errors.push('Automated content must not imply personal authorship');
 const sources=data.sources??[];const evidence=data.evidence??[];
 if(!sources.length||!evidence.length)errors.push('Missing sources or evidence');
 const sourceIds=new Set();
 for(const s of sources){
  if(sourceIds.has(s.id)||!s.id)errors.push('Source IDs must be unique');sourceIds.add(s.id);
  try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password||u.pathname==='/'&&!u.search)errors.push('Source must be an exact HTTPS document, not a homepage');}catch{errors.push('Invalid source URL');}
  if(!s.publisher||!s.title||!s.accessed||!Number.isFinite(Date.parse(s.accessed))||new Date(s.accessed)>now)errors.push('Invalid source metadata');
  if(s.published&&(!Number.isFinite(Date.parse(s.published))||new Date(s.published)>now))errors.push('Invalid source publication date');
  if(s.effective&&!Number.isFinite(Date.parse(s.effective)))errors.push('Invalid source effective date');
 }
 const ids=new Set();
 for(const e of evidence){
  if(!e.id||ids.has(e.id))errors.push('Evidence IDs must be unique');ids.add(e.id);
  if(!sourceIds.has(e.sourceId)||!e.claim||!e.excerpt||e.excerpt.length>1000)errors.push('Incomplete evidence');
  if(documents){const doc=documents.find(d=>d.id===e.sourceId);if(!doc||!normalize(doc.text).includes(normalize(e.excerpt)))errors.push(`Evidence passage not found: ${e.id}`);}
 }
 const refs=data.calculationRefs??[];
 for(const id of refs)if(!calculations[id])errors.push('Unknown calculation reference');
 for(const m of body.matchAll(/CALCULATION_TABLE:([a-z0-9-]+)/g))if(!refs.includes(m[1])||!calculations[m[1]])errors.push('Calculation marker has no registered method');
 for(const id of refs)if(!body.includes(`CALCULATION_TABLE:${id}`))errors.push('Calculation reference has no generated example');
 let tokens=[];try{tokens=marked.lexer(body);}catch{errors.push('Invalid Markdown');}
 marked.walkTokens(tokens,t=>{if(['html','code','image'].includes(t.type))errors.push('Raw HTML, code and images are not allowed in generated Markdown');if(t.type==='link'){try{const u=new URL(t.href,'https://themoneygoal.com');if(!['https:'].includes(u.protocol)||u.origin!=='https://themoneygoal.com'&&!sources.some(s=>s.url===u.href))errors.push('Unapproved external link');}catch{errors.push('Invalid link');}}});
 if(/\b(?:guaranteed returns?|buy now before|price target|stock tip|we tested|i tested|my portfolio|risk[- ]free investment)\b/i.test(body))errors.push('Prohibited claim or invented experience');
 if(data.automationRunId && (data.offerIds?.length||data.affiliate))errors.push('Automated drafts cannot activate promotions');
 return [...new Set(errors)];
}
export const serializeArticle=(data,body)=>`---\n${stringify(data,{lineWidth:0})}---\n\n${body.trim()}\n`;
