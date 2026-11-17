import test from 'node:test';import assert from 'node:assert/strict';
import{evidenceOptions,candidateQueue}from'../scripts/lib/editorial.mjs';import{assembleDraft}from'../scripts/lib/drafting.mjs';
test('quoted options are literal retrieved passages with bounded word counts',()=>{
 const doc={id:'cfpb',text:'Interest accrues according to the account terms. Read the card agreement for the calculation method. A monthly example is a simplified comparison rather than a billing statement.'};
 const options=evidenceOptions([doc],{title:'Credit card interest calculation'});assert.ok(options.length);for(const option of options){assert.ok(doc.text.includes(option.excerpt));assert.ok(option.excerpt.split(/\s+/).length<=12);assert.equal(option.sourceId,'cfpb');}
});
test('a model cannot supply its own quotation or an invented passage identifier',()=>{
 const doc={id:'cfpb',text:'Read the agreement for the calculation method.'};const draft={sections:Array.from({length:3},()=>({heading:'Terms',paragraphs:[]})),evidence:[{id:'e1',claim:'Invented claim',passageId:'invented',excerpt:'Invented quotation'}]};
 assert.throws(()=>assembleDraft(draft,{title:'Interest'},[doc],'test'),/Unknown source passage/);
});
test('research-backed evergreen candidates remain reachable ahead of a large news feed',()=>{
 const queue=candidateQueue([],['evergreen-a','evergreen-b'],Array.from({length:100},(_,i)=>'news-'+i));assert.deepEqual(queue.slice(0,4),['evergreen-a','news-0','evergreen-b','news-1']);
 assert.deepEqual(candidateQueue(['refresh'],['evergreen'],['news']),['refresh','evergreen','news']);
});
