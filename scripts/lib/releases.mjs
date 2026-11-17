export function deploymentDecision({release,head,check,bodyMatches=false}) {
 if(!release)return 'nothing';
 if(check?.status==='completed'&&check.conclusion==='success'&&bodyMatches)return 'verified';
 if(check?.status==='completed'&&check.conclusion!=='success')return head===release.sha?'rollback':'hold-newer-work';
 return 'pending';
}
