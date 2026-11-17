import { validateEvent } from '../../src/lib/events.js';
export async function onRequest(context) {
 const { request, env }=context;
 const headers={ 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'" };
 if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,Allow:'POST'}});
 const origin=request.headers.get('Origin');
 if(origin!==new URL(request.url).origin || request.headers.get('Sec-Fetch-Site')==='cross-site')return new Response(null,{status:403,headers});
 if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1')return new Response(null,{status:204,headers});
 if(!request.headers.get('Content-Type')?.startsWith('application/json')||Number(request.headers.get('Content-Length'))>1024)return new Response(null,{status:400,headers});
 let input;try{const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);}catch{return new Response(null,{status:400,headers});}
 const event=validateEvent(input);if(!event)return new Response(null,{status:400,headers});
 if(!env.TMG_METRICS)return new Response(null,{status:503,headers});
 // Store only the allowlisted event fields. No request headers, IP, UA or inputs.
 env.TMG_METRICS.writeDataPoint({indexes:[event.event],blobs:[event.page,event.market,event.tool,event.offer,event.placement],doubles:[1]});
 return new Response(null,{status:204,headers});
}
