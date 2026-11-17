/** Extract literal options before drafting: the model selects IDs instead of inventing quotations. */
export function evidenceOptions(documents,candidate){
 const terms=[...new Set(`${candidate.title??''} ${candidate.id??''}`.toLowerCase().match(/[a-z]{4,}/g)??[])];
 return documents.flatMap(doc=>{
  const text=doc.text.replace(/\s+/g,' ').trim();const words=text.split(' ');const options=[];const seen=new Set();
  for(let offset=0;offset<words.length;offset+=8){
   const excerpt=words.slice(offset,offset+12).join(' ');if(excerpt.length<15||seen.has(excerpt))continue;seen.add(excerpt);
   const lower=excerpt.toLowerCase();const score=terms.reduce((n,term)=>n+(lower.includes(term)?4:0),0)+(/\d/.test(excerpt)?1:0);
   options.push({id:`${doc.id}-p${offset}`,sourceId:doc.id,excerpt,score});
  }
  return options.sort((a,b)=>b.score-a.score).slice(0,20).map(({score,...option})=>option);
 });
}
/** A stream of low-value releases cannot exclude the researched evergreen queue. */
export function candidateQueue(refreshes,evergreen,news){
 const result=[];for(let i=0;i<Math.max(refreshes.length,evergreen.length,news.length);i++)for(const queue of [refreshes,evergreen,news])if(queue[i])result.push(queue[i]);return result;
}
