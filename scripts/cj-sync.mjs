/** Read-only CJ discovery. Never activates offers or accepts program terms. */
import {readFileSync,mkdirSync,writeFileSync}from'node:fs';import{XMLParser}from'fast-xml-parser';
const token=process.env.CJ_API_TOKEN,cid=process.env.CJ_PUBLISHER_CID;
if(!token||!cid){console.log('CJ sync held: configure CJ_API_TOKEN and CJ_PUBLISHER_CID. No offers were activated.');process.exit(0);}
if(!/^\d+$/.test(cid))throw new Error('Invalid CJ publisher CID');
const parser=new XMLParser({ignoreAttributes:false});const advertisers=[];
for(let page=1;page<=20;page++){
 const url=new URL('https://advertiser-lookup.api.cj.com/v2/advertiser-lookup');for(const[k,v]of Object.entries({'requestor-cid':cid,'advertiser-ids':'joined','records-per-page':'100','page-number':String(page)}))url.searchParams.set(k,v);
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`CJ lookup HTTP ${r.status}`);
 const data=parser.parse(await r.text());const raw=data['cj-api']?.advertisers?.advertiser??[];const rows=Array.isArray(raw)?raw:[raw];advertisers.push(...rows);if(rows.length<100)break;if(page===20)throw new Error('CJ pagination exceeded limit; result is incomplete');
}
mkdirSync('automation-runtime',{recursive:true});
writeFileSync('automation-runtime/cj-joined-advertisers.json',JSON.stringify({checkedAt:new Date().toISOString(),advertisers,activation:'held-until-country-terms-and-property-verification'},null,2));
console.log(`Read ${advertisers.length} joined CJ advertisers. Saved a private run artifact; none were activated.`);
