import { offerAvailable, trackedOfferUrl } from './offer-policy.js';
export function createOfferHandler(offers) {
 return function onRequestGet({request}) {

 const url=new URL(request.url);const id=url.searchParams.get('id');const market=url.searchParams.get('market');
 const found=offers.find(o=>o.id===id);const offer=offerAvailable(found,market)?found:null;
 if(!offer)return new Response('This paid link is unavailable. Compare current provider information before applying.',{status:410,headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
 const page=(url.searchParams.get('page')??'site').replace(/[^a-z0-9-]/gi,'').slice(0,60);
 const placement=(url.searchParams.get('placement')??'link').replace(/[^a-z0-9-]/gi,'').slice(0,60);
 return new Response(null,{status:302,headers:{Location:trackedOfferUrl(offer,page,placement),'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}

}
