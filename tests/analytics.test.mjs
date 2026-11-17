import test from 'node:test';import assert from 'node:assert/strict';
import{createAnalyticsController,MEASUREMENT_ID,CONSENT_KEY,readAnalyticsConsent,safeAnalyticsLocation}from'../src/lib/analytics.js';
function fixture({hostname='themoneygoal.com',privacy=false}={}){
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};const scripts=[];const cookieWrites=[];
 const win={location:{hostname},dataLayer:[]};const doc={title:'Expense ratio calculator',referrer:'https://www.google.com/search?q=private-income-98765',querySelector:()=>({getAttribute:()=> 'https://themoneygoal.com/calculators/expense-ratio?balance=private-balance-12345#private-debt'}),createElement:()=>({dataset:{}}),head:{append:s=>scripts.push(s)}};
 Object.defineProperty(doc,'cookie',{get:()=> '_ga=old; _ga_1F9L70WQWL=old; essential=keep',set:v=>cookieWrites.push(v)});
 const controller=createAnalyticsController({win,doc,storage,nav:{globalPrivacyControl:privacy}});return {controller,win,doc,storage,scripts,cookieWrites};
}
const completion={event:'tool_completion',page:'/calculators/expense-ratio',tool:'expense-ratio',market:'IN'};
test('no Google library or events load before an affirmative choice',()=>{const f=fixture();f.controller.init();assert.equal(f.controller.track(completion),false);assert.equal(f.scripts.length,0);assert.equal(f.win.dataLayer.length,0);f.controller.choose('denied');assert.equal(f.scripts.length,0);});
test('consent permits only safe locations and allowlisted events, never financial values',()=>{
 const f=fixture();f.controller.init();f.controller.choose('granted');assert.equal(f.scripts.length,1);assert.equal(f.controller.track(completion),true);assert.equal(f.controller.track({...completion,balance:'private-financial-value'}),false);
 const text=JSON.stringify(f.win.dataLayer.map(args=>Array.from(args)));for(const secret of ['private-income','private-balance','private-debt','private-financial-value'])assert.equal(text.includes(secret),false);
 assert.ok(text.includes('https://www.google.com'));assert.equal(f.win.dataLayer.filter(args=>args[0]==='event'&&args[1]==='page_view').length,1);
});
test('revoking consent disables collection and removes only accessible analytics cookies',()=>{
 const f=fixture();f.controller.choose('granted');f.controller.choose('denied');const count=f.win.dataLayer.length;
 assert.equal(f.win[`ga-disable-${MEASUREMENT_ID}`],true);assert.equal(f.controller.track(completion),false);assert.equal(f.win.dataLayer.length,count);assert.ok(f.cookieWrites.length);assert.ok(f.cookieWrites.every(v=>v.startsWith('_ga')));assert.equal(readAnalyticsConsent(f.storage),'denied');
});
test('browser privacy signals and preview hosts prevent Google collection',()=>{
 const blocked=fixture({privacy:true});blocked.controller.choose('granted');assert.equal(blocked.scripts.length,0);assert.equal(blocked.controller.track(completion),false);
 const preview=fixture({hostname:'preview.pages.dev'});preview.controller.choose('granted');assert.equal(preview.scripts.length,0);
});
test('expired preferences cannot enable measurement and canonical URLs lose query strings',()=>{
 const f=fixture();f.storage.setItem(CONSENT_KEY,JSON.stringify({version:1,choice:'granted',expiresAt:1}));f.controller.init();assert.equal(f.scripts.length,0);
 assert.equal(safeAnalyticsLocation('https://themoneygoal.com/tool?income=500#debt'), 'https://themoneygoal.com/tool');assert.equal(safeAnalyticsLocation('https://untrusted.example/tool'),null);
});
