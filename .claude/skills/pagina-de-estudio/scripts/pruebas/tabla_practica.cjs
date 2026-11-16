const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,n] of [[1200,900,'d'],[390,844,'p']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
console.log(n,'bars',await p.locator('.tp-bar').count());
const bar=p.locator('.tp-bar').first();await bar.scrollIntoViewIfNeeded();await bar.locator('[data-m="prac"]').click();await p.waitForTimeout(300);
const wrap=p.locator('.tbl[data-practica]').first();
await p.evaluate(()=>{const w=document.querySelector('.tbl[data-practica]');w.closest('section').classList.remove('pre')});
await p.screenshot({path:`tp_empty_${n}.png`});
// solve correctly: for each slot, find chip whose text equals original
const total=await wrap.locator('td.tp-slot').count();
for(let i=0;i<total;i++){
  const want=await p.evaluate(i=>{const w=document.querySelector('.tbl[data-practica]');return null},i);
}
// use internal: map by reading original html from a hidden copy? Instead: click chip then slot using text knowledge from backup table
const answers=await p.evaluate(()=>{const w=document.querySelector('.tbl[data-practica]');return [...w.querySelectorAll('td.tp-slot')].map((td,i)=>i)});
const orig=await p.evaluate(()=>window.__orig);
await p.close();
// simple approach: switch to ver to read texts, then practice and place
const q=await b.newPage({viewport:{width:w,height:h}});q.on('pageerror',e=>errs.push(e.message));await q.goto('file://'+process.argv[2]);await q.waitForTimeout(500);
await q.evaluate(()=>document.querySelectorAll('section').forEach(s=>s.classList.remove('pre')));
const texts=await q.evaluate(()=>{const w=document.querySelector('.tbl[data-practica]');return [...w.querySelectorAll('tbody tr')].flatMap(r=>[...r.cells].slice(1).map(td=>td.textContent.trim()))});
const b0=q.locator('.tp-bar').first();await b0.scrollIntoViewIfNeeded();await b0.locator('[data-m="prac"]').click();
const slots=q.locator('.tbl[data-practica] td.tp-slot').first().locator('xpath=ancestor::table').locator('td.tp-slot');
for(let i=0;i<texts.length;i++){if(i===0)continue;/* leave first wrong */ await q.locator('.tp-bank .tp-chip',{hasText:texts[i]}).first().click();await slots.nth(i).click()}
// put a wrong chip in slot 0: whatever remains first
await q.locator('.tp-bank .tp-chip').first().click();await slots.nth(0).click();
await q.locator('.tp-res .btn.primary').click();await q.waitForTimeout(300);
console.log(n,'result',await q.locator('.tp-res').first().innerText());
await q.locator('.tbl[data-practica]').first().screenshot({path:`tp_checked_${n}.png`});
// columna mode table
const bc=q.locator('.tp-bar').nth(2);await bc.scrollIntoViewIfNeeded();await bc.locator('[data-m="prac"]').click();await q.waitForTimeout(200);
console.log(n,'cesarea chips',await q.locator('.tp-bank').count());
await bc.locator('[data-m="ver"]').click();console.log(n,'restored slots',await q.locator('td.tp-slot').count()-await q.locator('.tbl[data-practica]').first().locator('td.tp-slot').count());
console.log(n,'scrollW',await q.evaluate(()=>document.documentElement.scrollWidth));await q.close()}
console.log('errs',errs);await b.close()})();
