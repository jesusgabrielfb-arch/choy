const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1000);
await p.click('#sim-new');await p.waitForTimeout(800);
const info=await p.evaluate(()=>({lines:document.querySelectorAll('.sim-lines li').length,words:document.querySelectorAll('.sim-words span').length,fill:document.querySelectorAll('.sim-fill li').length,cases:document.querySelectorAll('.sim-case').length,imgs:document.querySelectorAll('.sim-img').length,svgs:document.querySelectorAll('.sim-img svg').length,v:document.querySelectorAll('.sim-part>ol>li').length,high:document.querySelectorAll('.sim-high').length,inputs:document.querySelectorAll('.sim-in').length}));
console.log(JSON.stringify(info));
await p.locator('#sim-sheet').screenshot({path:'sim1.png'});
// fill with correct answers from the key
await p.evaluate(()=>{document.querySelectorAll('#sim-sheet .sim-in').forEach(el=>{const k=el.parentElement.querySelector('.sim-key');if(!k)return;
  let t=k.textContent.trim();if(el.classList.contains('letter'))t=t.split(' ')[0];if(el.type==='date'){return}
  el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}))})});
await p.click('#sim-grade');await p.waitForTimeout(800);
console.log('result',(await p.locator('#sim-result').innerText()).replace(/\n/g,' | '));
await p.locator('#sim-result').screenshot({path:'sim_res.png'});
// generate a second, check list & differences
await p.click('#sim-new2');await p.waitForTimeout(500);
console.log('list rows',await p.locator('.sim-row').count());
const w2=await p.evaluate(()=>[...document.querySelectorAll('.sim-words span')].map(s=>s.textContent.slice(2)).join(','));
console.log('words2 sample',w2.slice(0,120));
// print layout via emulateMedia
await p.evaluate(()=>document.body.classList.add('print-sim'));await p.emulateMedia({media:'print'});
await p.pdf({path:'sim_print.pdf',format:'Letter',printBackground:true});
console.log('errors',errs);await b.close()})();
