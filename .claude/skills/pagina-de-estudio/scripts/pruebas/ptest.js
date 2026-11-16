const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
const counts=await p.evaluate(()=>{const c={};BANK.forEach(q=>{c[q[0]]=(c[q[0]]||0)+1});return {total:BANK.length,...c,cards:CARDS.length,rev:REV.length,byTopic:Object.keys(TOPICS).map(k=>k+':'+BANK.filter(q=>q[1]===k).length).join(' ')}});
console.log(JSON.stringify(counts));
// validate data
const bad=await p.evaluate(()=>BANK.filter(q=>!TOPICS[q[1]]||!TYPES[q[0]]||(q[0]==='mc'&&q[3].length<2)||(q[0]==='match'&&new Set(q[3].map(x=>x[1])).size!==q[3].length)).map(q=>q[2]));
console.log('bad',bad);
await p.locator('#practica').scrollIntoViewIfNeeded();
await p.screenshot({path:'s_setup.png',clip:{x:0,y:0,width:1100,height:1000}});
// choose topics: click all to clear, then ciclo, masc
await p.click('.tchip.all');await p.click('.tchip[data-t="ciclo"]');await p.click('.tchip[data-t="masc"]');
console.log('sum:',await p.locator('#setup-sum').innerText());
await p.click('.mode[data-m="guiada"]');await p.selectOption('#qcount','all');await p.click('#go');await p.waitForTimeout(400);
let seenTypes=new Set();
for(let i=0;i<300;i++){
  const done=await p.locator('#quiz .score').count();if(done)break;
  const t=await p.evaluate(()=>QS[qi].t);seenTypes.add(t);
  if(t==='mc'||t==='tf'){const k=await p.evaluate(()=>QS[qi].opts.findIndex(o=>o.ok));await p.locator('#quiz .opt').nth(k).click()}
  if(t==='open'){await p.fill('#openans',await p.evaluate(()=>QS[qi].model));await p.click('#qcheck')}
  if(t==='fill'){const a=await p.evaluate(()=>QS[qi].ans.map(x=>x[0]));for(let j=0;j<a.length;j++)await p.locator('#quiz .fin').nth(j).fill(a[j]);if(!globalThis._fs){globalThis._fs=1;await p.locator('#p-quiz').screenshot({path:'s_fill.png'})}await p.click('#qcheck')}
  if(t==='order'){const n=await p.evaluate(()=>QS[qi].items.length);for(let j=0;j<n;j++){const txt=await p.evaluate(j=>QS[qi].items[j],j);await p.locator('#ordpool .ochip',{hasText:txt}).first().click()}
    if(i<12)await p.locator('#p-quiz').screenshot({path:'s_order.png'});await p.click('#qcheck')}
  if(t==='match'){const n=await p.evaluate(()=>QS[qi].pairs.length);for(let j=0;j<n;j++){await p.locator('#mleft .mitem').nth(j).click();const r=await p.evaluate(j=>QS[qi].pairs[j][1],j);await p.locator('#mright .mitem',{hasText:r}).first().click()}
    await p.locator('#p-quiz').screenshot({path:'s_match.png'});await p.click('#qcheck')}
  await p.waitForTimeout(80);await p.click('#qnext');await p.waitForTimeout(60);
}
console.log('types seen',[...seenTypes]);
await p.waitForTimeout(800);
console.log('END',(await p.locator('#quiz .score').innerText()).replace(/\n/g,' | '));
await p.locator('#p-quiz').screenshot({path:'s_end.png'});
// exam mode quick: wrong answers
await p.click('#qsetup');await p.click('.mode[data-m="examen"]');await p.selectOption('#qcount','10');await p.click('#go');await p.waitForTimeout(300);
for(let i=0;i<12;i++){const done=await p.locator('#quiz .score').count();if(done)break;const t=await p.evaluate(()=>QS[qi].t);
  if(t==='mc'||t==='tf')await p.locator('#quiz .opt').first().click();
  else if(t==='open'){await p.fill('#openans','no sé');await p.click('#qcheck')}
  else if(t==='fill'){await p.click('#qcheck')}
  else if(t==='order'){const n=await p.evaluate(()=>QS[qi].items.length);for(let j=0;j<n;j++)await p.locator('#ordpool .ochip').first().click();await p.click('#qcheck')}
  else if(t==='match'){const n=await p.evaluate(()=>QS[qi].pairs.length);for(let j=0;j<n;j++){await p.locator('#mleft .mitem:not(.linked)').first().click();await p.locator('#mright .mitem:not(.linked)').first().click()}await p.click('#qcheck')}
  await p.waitForTimeout(350)}
console.log('EXAM',(await p.locator('#quiz .score').innerText()).replace(/\n/g,' | '));
// cards by topic
await p.click('#qsetup');await p.click('.mode[data-m="tarjetas"]');await p.click('#go');await p.waitForTimeout(300);
console.log('cards',await p.locator('#fcount').innerText(),await p.locator('#fknown').innerText());
await p.locator('#p-cards .pback').click();await p.click('.mode[data-m="repaso"]');await p.click('#go');await p.waitForTimeout(300);
console.log('rev rows',await p.locator('#revbody tr').count());
// practicar este tema button
await p.locator('.tprac[data-prac="fec"]').click();await p.waitForTimeout(600);
console.log('quick',await p.evaluate(()=>[studyMode,selTopics.join(','),QS.length]));
console.log('errors',errs);await b.close()})();
