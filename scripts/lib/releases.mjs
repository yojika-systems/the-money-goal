export function deploymentDecision({release,head,check,bodyMatches=false}) {
 if(!release)return 'nothing';
 if(check?.status==='completed'&&check.conclusion==='success'&&bodyMatches)return 'verified';
 if(check?.status==='completed'&&check.conclusion!=='success')return head===release.sha?'rollback':'hold-newer-work';
 return 'pending';
}
export function guardedRollback(releaseSha,git){
 git('fetch','origin','main');
 if(git('rev-parse','origin/main')!==releaseSha)throw new Error('Deployment failed but main has newer work; rollback held to preserve it');
 git('checkout','--detach','origin/main');git('config','user.name','MoneyGoal publisher');git('config','user.email','publisher@users.noreply.github.com');
 git('revert','--no-edit',releaseSha);const rollback=git('rev-parse','HEAD');git('push','origin',`${rollback}:refs/heads/main`);return rollback;
}
