import test from 'node:test';import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,readFileSync,rmSync } from 'node:fs';import {tmpdir} from 'node:os';import{join}from'node:path';import{execFileSync}from'node:child_process';
import {guardedRollback}from'../scripts/lib/releases.mjs';
test('a real Git rollback restores content and refuses to overwrite a newer main',()=>{
 const root=mkdtempSync(join(tmpdir(),'tmg-rollback-'));const remote=join(root,'remote.git');const work=join(root,'checkout');
 const run=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  run(root,'init','--bare',remote);run(root,'init','-b','main',work);const git=(...args)=>run(work,...args);
  git('config','user.name','Rollback test');git('config','user.email','test@example.invalid');git('remote','add','origin',remote);
  writeFileSync(join(work,'article.md'),'verified content\n');git('add','.');git('commit','-m','Verified content');git('push','-u','origin','main');
  writeFileSync(join(work,'article.md'),'failed content\n');git('commit','-am','Failed release');const failed=git('rev-parse','HEAD');git('push');
  const rollback=guardedRollback(failed,git);assert.notEqual(rollback,failed);assert.equal(readFileSync(join(work,'article.md'),'utf8'),'verified content\n');assert.equal(run(remote,'rev-parse','main'),rollback);
  git('checkout','main');git('reset','--hard','origin/main');writeFileSync(join(work,'article.md'),'newer verified work\n');git('commit','-am','Newer work');git('push');const newer=git('rev-parse','HEAD');
  assert.throws(()=>guardedRollback(failed,git),/newer work/);assert.equal(run(remote,'rev-parse','main'),newer);assert.equal(readFileSync(join(work,'article.md'),'utf8'),'newer verified work\n');
 }finally{rmSync(root,{recursive:true,force:true});}
});
