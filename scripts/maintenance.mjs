import { readFileSync,writeFileSync,mkdirSync,appendFileSync } from 'node:fs';
import { getOffer,offers } from '../src/lib/offers.js';
import { fetchAllowed } from './lib/network.mjs';
import { articleFiles,readArticle } from './lib/content.mjs';
const sources=JSON.parse(readFileSync('automation/sources.json','utf8'));
const now=new Date();const report={checkedAt:now.toISOString(),offers:[],dueReviews:[],integrations:{openai:Boolean(process.env.OPENAI_API_KEY),cj:Boolean(process.env.CJ_API_TOKEN),searchConsole:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)},paidGeneration:false};
for(const o of offers.filter(o=>o.status==='active')){
 let status=getOffer(o.id,o.markets?.[0],now)?'active':'expired-or-unapproved';
 try{await fetchAllowed(o.url,sources);await fetchAllowed(o.termsUrl,sources);}catch{status='source-unavailable';}
 if(status==='source-unavailable'){o.status='suspended';o.notes='Automatic hold: a provider source was unavailable. Recheck exact terms and eligibility before reactivation.';}
 report.offers.push({id:o.id,status,expiresAt:o.expiresAt});
 // Reachability is not a terms or approval review. Do not extend any deadline here.
}
if(report.offers.some(o=>o.status==='source-unavailable'))writeFileSync('src/data/offers.json',JSON.stringify(offers,null,2)+'\n');
for(const file of articleFiles()){const {data}=readArticle(file);if(new Date(data.reviewDue)<=now)report.dueReviews.push({key:data.translationKey,market:data.market});}
mkdirSync('automation-runtime',{recursive:true});writeFileSync('automation-runtime/maintenance.json',JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n## Maintenance\n\n${report.offers.map(o=>`- ${o.id}: ${o.status}`).join('\n')}\n\nDue source reviews: ${report.dueReviews.length}. No paid calls were made by maintenance.\n`);
console.log(JSON.stringify(report,null,2));
