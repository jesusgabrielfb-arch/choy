const {chromium}=require('playwright');const fs=require('fs');
const D=JSON.parse(fs.readFileSync(process.argv[3]||(__dirname+'/../../plantilla/examen-ejemplo-datos.json'),'utf8'));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,n] of [[1100,'d'],[390,'p']]){const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('section').forEach(s=>s.classList.remove('pre'))});
await p.locator('#ex24-check').click();await p.waitForTimeout(300);console.log(n,'empty',(await p.locator('#ex24-res').innerText()).split('\n').slice(0,3).join(' | '));
if(n==='d'){
for(let i=0;i<D.p1.length;i++)await p.locator(`.p1q[data-i="${i}"] input[value="${D.p1[i][2]}"]`).check();
for(let i=0;i<D.p2.length;i++){const q=D.p2[i];for(let k=0;k<q.items.length;k++)await p.locator(`tr[data-i="${i}"] input`).nth(k).fill(q.items[k].show)}
for(let i=0;i<D.p3.length;i++)await p.locator(`.p3 .row[data-i="${i}"] textarea`).fill(D.p3[i].model);
await p.locator('#ex24-check').click();await p.waitForTimeout(400);console.log(n,'full',(await p.locator('#ex24-res').innerText()).split('\n').slice(0,3).join(' | '));
const badp2=await p.evaluate(()=>[...document.querySelectorAll('.p2 input.bad')].map(i=>i.closest('tr').querySelector('td').textContent.slice(0,40)+' => '+i.value));console.log('bad p2',badp2);
const badp3=await p.evaluate(()=>[...document.querySelectorAll('.p3 textarea:not(.ok)')].map(t=>t.closest('.row').querySelector('b').textContent));console.log('bad p3',badp3);
// persistence
await p.reload();await p.waitForTimeout(500);console.log('restored radios',await p.locator('.ex24 input[type=radio]:checked').count());
}
await p.evaluate(()=>{const e=document.getElementById('parcial-2024');scrollTo(0,e.getBoundingClientRect().top+scrollY-70)});await p.waitForTimeout(300);await p.screenshot({path:`ex24_${n}.png`});
console.log(n,'sw',await p.evaluate(()=>document.documentElement.scrollWidth));await p.close()}
console.log('errs',errs);await b.close()})();
