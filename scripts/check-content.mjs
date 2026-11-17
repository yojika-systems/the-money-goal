import { articleFiles, readArticle, validateArticle } from './lib/content.mjs';
import { existsSync,readFileSync } from 'node:fs';
const errors=[];const seen=new Set();
for(const file of articleFiles()) {
 const {data,body}=readArticle(file);
 for(const error of validateArticle(data,body))errors.push(`${file}: ${error}`);
 const key=`${data.market}:${data.lang}:${data.translationKey}`;
 if(seen.has(key))errors.push(`${file}: Duplicate topic key ${key}`);seen.add(key);
 if(file.endsWith('.mdx'))errors.push('MDX cannot be generated');
}
if(existsSync('automation-runtime/pending.json')){
 const pkg=JSON.parse(readFileSync('automation-runtime/pending.json','utf8'));
 for(const error of validateArticle(pkg.data,pkg.body,{documents:pkg.documents}))errors.push(`Pending: ${error}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Content check: ${seen.size} unique articles; evidence, methods and publishing states valid.`);
