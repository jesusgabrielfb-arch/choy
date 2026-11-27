const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
console.log('cards',await p.locator('.dp-q').count());
// scene coverage
const cov=await p.evaluate(()=>{const c={};document.querySelectorAll('.dp-q').forEach(el=>{});return 0});
await p.locator('#test').scrollIntoViewIfNeeded();await p.waitForTimeout(600);
// answer first 3 (first right, second wrong)
for(let i=0;i<3;i++){const card=p.locator('.dp-q').nth(i);await card.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  const k=await card.evaluate((el,i)=>{const btns=[...el.querySelectorAll('.dp-opt')];return 0},i);
  await card.locator('.dp-opt').nth(i===1?1:0).click();await p.waitForTimeout(200)}
console.log('stats',await p.locator('.dp-nums').innerText());
await p.locator('.dp-q').nth(0).screenshot({path:'dp1.png'});
await p.locator('.dp-q').nth(1).screenshot({path:'dp2.png'});
// check all scene kinds render w/o errors: render scenes for all cards via evaluate scroll
const kinds=await p.evaluate(async()=>{const els=[...document.querySelectorAll('.dp-q')];for(const el of els){el.scrollIntoView();await new Promise(r=>setTimeout(r,8))}await new Promise(r=>setTimeout(r,300));
  const pend=els.filter(e=>e.querySelector('.dp-anim').dataset.pending).length;const cards=els.filter(e=>e.querySelector('.dp-anim').innerHTML.includes('recuerda esta idea')).length;return {pend,cards,total:els.length}});
console.log(kinds);
await p.click('#dp-onlybad');console.log('visible after only-bad',await p.locator('.dp-q:not([hidden])').count());
await p.selectOption('#dp-topic','ciclo');await p.waitForTimeout(200);console.log('ciclo cards',await p.locator('.dp-q').count());
console.log('errors',errs);await b.close()})();
