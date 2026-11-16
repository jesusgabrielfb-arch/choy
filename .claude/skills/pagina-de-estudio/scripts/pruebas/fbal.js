const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const out={};for(const k of Object.keys(TOPICS)){const L=balanced(BANK.filter(q=>q[1]===k)).slice(0,25);const ty={},su={};L.forEach(q=>{ty[q[0]]=(ty[q[0]]||0)+1;const s=subOf(q);su[s]=(su[s]||0)+1});out[k]=[ty,su]}
 const allSub={};BANK.forEach(q=>{const s=q[1]+':'+subOf(q);allSub[s]=(allSub[s]||0)+1});
 const bad=BANK.filter(q=>q[0]==='fill'&&(q[2].split('___').length-1)!==q[3].length).map(q=>q[2]);
 const fz=[fillOk('prostata',['prostata']),fillOk('Próstata',['prostata']),fillOk('epididmo',['epididimo']),fillOk('la uretra',['uretra']),fillOk('vagina',['uretra']),fillOk('mitocondria',['mitocondrias'])];
 return {out,otro:Object.entries(allSub).filter(([k])=>k.endsWith(':otro')),bad,fz}});
for(const k in r.out)console.log(k.padEnd(8),JSON.stringify(r.out[k][0]),JSON.stringify(r.out[k][1]));console.log('otro',JSON.stringify(r.otro));console.log('badfill',r.bad,'fuzzy',r.fz,'errs',errs);await b.close()})();
