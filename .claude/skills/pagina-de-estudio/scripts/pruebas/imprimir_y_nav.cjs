const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1024,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
await p.evaluate(()=>document.getElementById('simulacro').scrollIntoView());await p.waitForTimeout(500);
for(const [id,n] of [['sim-print','exam'],['sim-printkey','key']]){
const [pop]=await Promise.all([ctx.waitForEvent('page'),p.click('#'+id)]);
pop.on('pageerror',e=>errs.push('pop:'+e.message));
await pop.waitForLoadState();await pop.waitForTimeout(800);
console.log(n,'parts',await pop.locator('.sim-part').count(),'keys visible',await pop.locator('.sim-key:visible').count(),'bodyclass',await pop.evaluate(()=>document.body.className));
await pop.screenshot({path:`prt_${n}.png`});
await pop.emulateMedia({media:'print'});await pop.pdf({path:`prt_${n}.pdf`,format:'Letter',printBackground:true});await pop.close()}
// nav brand
await p.evaluate(()=>document.getElementById('fecundacion').scrollIntoView());await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const b=document.querySelector('.nav .brand').getBoundingClientRect();return [Math.round(b.left),Math.round(b.right)]});console.log('brand rect',r);
await p.screenshot({path:'prt_nav.png',clip:{x:0,y:0,width:1024,height:90}});
console.log('errs',errs);await b.close()})();
