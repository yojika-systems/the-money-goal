import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
export function allowedUrl(value, sources) {
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.port||!sources.some(s=>s.hosts.includes(u.hostname)))throw new Error('Source URL is outside the approved host list');
 return u;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function fetchAllowed(url,sources,{fetcher=fetch,maxBytes=2000000,retries=2}={}) {
 let current=allowedUrl(url,sources);
 for(let redirect=0;redirect<5;redirect++){
  let response;
  for(let attempt=0;attempt<=retries;attempt++){
   try{response=await fetcher(current,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'User-Agent':'TheMoneyGoal-Publisher/1.0 (+https://themoneygoal.com/methodology)','Accept':'text/html, application/rss+xml, application/xml, text/xml'}});if(response.status===429||response.status>=500){if(attempt<retries){await response.body?.cancel();await wait(500*(attempt+1));continue;}}break;}catch(e){if(attempt===retries)throw e;await wait(500*(attempt+1));}
  }
  if(response.status>=300&&response.status<400){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw new Error('Source redirect has no destination');current=allowedUrl(new URL(location,current).href,sources);continue;}
  if(!response.ok)throw new Error(`Source returned HTTP ${response.status}`);
  const type=response.headers.get('content-type')??'';
  if(!/html|xml|text\/plain/.test(type))throw new Error('Unsupported source type; hold for document extraction');
  if(Number(response.headers.get('content-length'))>maxBytes)throw new Error('Source too large');
  const reader=response.body.getReader();const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('Source too large');}chunks.push(value);}
  const body=Buffer.concat(chunks).toString('utf8');return {url:current.href,body,type};
 }
 throw new Error('Source redirect limit exceeded');
}
export async function collectDocument(url,sources,opts={}) {
 const fetched=await fetchAllowed(url,sources,opts);const source=sources.find(s=>s.hosts.includes(new URL(fetched.url).hostname));
 const $=load(fetched.body);$('script,style,nav,footer,header,form,aside,noscript').remove();
 const main=$('main,article,[role=main],#content,.content__wrapper').first();
 const text=(main.length?main.text():$('body').text()).replace(/\s+/g,' ').trim();
 if(text.length<200||/just a moment|access denied|enable javascript and cookies/i.test(text.slice(0,600)))throw new Error('Source body unavailable or blocked');
 return {id:source.id+'-'+createHash('sha256').update(fetched.url).digest('hex').slice(0,10),url:fetched.url,publisher:source.publisher,market:source.market,title:$('h1').first().text().trim()||$('title').text().trim()||source.publisher,text:text.slice(0,60000),accessed:new Date().toISOString().slice(0,10),fingerprint:createHash('sha256').update(text).digest('hex'),primary:source.primary};
}
export function parseFeed(body,source,now=new Date()){
 const parsed=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(body);
 const raw=parsed.rss?.channel?.item??parsed.feed?.entry??parsed['rdf:RDF']?.item??[];
 return (Array.isArray(raw)?raw:[raw]).flatMap(item=>{
  let link=item.link;if(Array.isArray(link))link=link.find(x=>x['@_rel']==='alternate')??link[0];
  const url=typeof link==='string'?link:link?.['@_href'];
  const date=item.pubDate??item.published??item.updated??item['dc:date'];
  const time=Date.parse(date);if(!url||!Number.isFinite(time)||time>now.getTime())return [];
  try{allowedUrl(url,[source]);}catch{return [];}
  const digest=createHash('sha256').update(url).digest('hex').slice(0,8);const title=typeof item.title==='string'?item.title:item.title?.['#text'];const slug=String(title??source.id).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65).replace(/-$/,'');
  return [{id:`${slug||source.id}-${digest}`,title:typeof item.title==='string'?item.title:item.title?.['#text'],url,published:new Date(time).toISOString(),market:source.market,topic:'economy',contentType:'news',sources:[url],calculationRefs:[],readerDecision:'Understand the official change, effective date, limits and affected readers'}];
 });
}
