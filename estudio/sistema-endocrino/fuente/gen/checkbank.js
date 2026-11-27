const fs=require('fs');let src='['+['bank1.js','bank2.js','bank3.js','bank4.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+']';
let B;try{B=eval(src)}catch(e){console.log('ERR',e.message);process.exit(1)}
const bad=[];const cnt={};
B.forEach((q,i)=>{const [t,top]=q;cnt[top]=cnt[top]||{};cnt[top][t]=(cnt[top][t]||0)+1;
 if(t==='open'){if(Array.isArray(q[3]))q[3]=q[3][0];if(!Array.isArray(q[4]))bad.push([i,'openkeys'])}
 if(t==='mc'&&(!Array.isArray(q[3])||q[3].length<3||new Set(q[3]).size!==q[3].length))bad.push([i,'mc',q[2]]);
 if(t==='match'){const r=q[3].map(p=>p[1]);if(new Set(r).size!==r.length)bad.push([i,'match dup',q[2]])}
 if(t==='fill'){const n=(q[2].match(/___/g)||[]).length;if(n!==q[3].length)bad.push([i,'fill n',q[2]])}
 if(t==='tf'&&typeof q[3]!=='boolean')bad.push([i,'tf']);});
console.log('total',B.length);for(const k in cnt)console.log(k,Object.values(cnt[k]).reduce((a,b)=>a+b),JSON.stringify(cnt[k]));console.log('bad',JSON.stringify(bad));
fs.writeFileSync('bank.json',JSON.stringify(B));
