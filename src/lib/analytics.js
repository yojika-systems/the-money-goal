import { validateEvent } from './events.js';
export const MEASUREMENT_ID='G-1F9L70WQWL';
export const CONSENT_KEY='tmg_analytics_v1';
const consentDays=180;
export const hasPrivacySignal=nav=>nav?.doNotTrack==='1'||nav?.globalPrivacyControl===true;
export function readAnalyticsConsent(storage,now=Date.now()){
 try{const value=JSON.parse(storage.getItem(CONSENT_KEY));return value?.version===1&&value.expiresAt>now&&['granted','denied'].includes(value.choice)?value.choice:null;}catch{return null;}
}
export function hasMeasurementConsent(nav,storage){return !hasPrivacySignal(nav)&&readAnalyticsConsent(storage)==='granted';}
export function safeAnalyticsLocation(canonical){try{const u=new URL(canonical);if(u.origin!=='https://themoneygoal.com')return null;return u.origin+u.pathname;}catch{return null;}}
const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
export function createAnalyticsController({win,doc,nav,storage,now=()=>Date.now()}){
 let started=false;let pageSent=false;
 const allowed=()=>hasMeasurementConsent(nav,storage);
 const location=()=>safeAnalyticsLocation(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'));
 const disableCookies=()=>{
  for(const entry of doc.cookie.split(';')){const name=entry.split('=')[0].trim();if(!/^_ga(?:_|$)/.test(name))continue;for(const domain of ['', '; domain=themoneygoal.com','; domain=.themoneygoal.com'])doc.cookie=`${name}=; Max-Age=0; path=/${domain}; SameSite=Lax; Secure`;}
 };
 function start(){
  if(!allowed()||win.location.hostname!=='themoneygoal.com'||!location())return;
  win[`ga-disable-${MEASUREMENT_ID}`]=false;
  if(!started){
   started=true;win.dataLayer=win.dataLayer||[];win.gtag=win.gtag||function(){win.dataLayer.push(arguments);};
   win.gtag('consent','default',denied);win.gtag('consent','update',{...denied,analytics_storage:'granted'});win.gtag('js',new Date(now()));
   let referrer='';try{referrer=new URL(doc.referrer).origin;}catch{}
   win.gtag('set',{page_location:location(),page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false});
   win.gtag('config',MEASUREMENT_ID,{send_page_view:false,page_location:location(),page_referrer:referrer,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:consentDays*86400,cookie_update:false});
   const script=doc.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;script.dataset.moneygoalAnalytics='true';script.onload=()=>{script.dataset.loaded='true';};doc.head.append(script);
  }else win.gtag('consent','update',{...denied,analytics_storage:'granted'});
  if(!pageSent){win.gtag('event','page_view',{page_location:location(),page_title:doc.title});pageSent=true;}
 }
 return {
  init(){if(!allowed())win[`ga-disable-${MEASUREMENT_ID}`]=true;start();},
  choose(choice){
   const value=choice==='granted'&&!hasPrivacySignal(nav)?'granted':'denied';
   try{storage.setItem(CONSENT_KEY,JSON.stringify({version:1,choice:value,expiresAt:now()+consentDays*86400000}));}catch{}
   if(value==='granted')start();else{win[`ga-disable-${MEASUREMENT_ID}`]=true;disableCookies();}
   return value;
  },
  track(input){
   const event=validateEvent(input);if(!allowed()||!event)return false;start();if(!started)return false;
   const {event:name,page,...metadata}=event;win.gtag('event',name,{...metadata,page_location:location(),page_path:page});return true;
  }
 };
}
let controller;
export function installAnalyticsController(value){controller=value;}
export function sendGoogleEvent(event){return controller?.track(event)??false;}
