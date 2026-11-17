import {getCollection} from 'astro:content';
import {isPublished,postHref,TOPICS} from '../lib/publication.js';
export async function GET(){
 const posts=await getCollection('blog',({data})=>isPublished(data));
 const pages=['','/guides','/blog','/calculators','/calculators/expense-ratio','/calculators/debt-payoff','/calculators/card-fee','/financial-freedom','/financial-health','/money-mistakes','/mutual-funds','/partner','/global','/in','/us','/topics','/about','/methodology','/privacy','/affiliate-disclosure','/corrections',...TOPICS.filter(t=>posts.some(p=>p.data.topic===t.id)).map(t=>`/topics/${t.id}`),...posts.map(postHref)];
 if(posts.some(p=>p.data.contentType==='news'))pages.push('/news');
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(pages)].map(path=>`<url><loc>${escape('https://themoneygoal.com'+path)}</loc></url>`).join('')+'</urlset>';
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
