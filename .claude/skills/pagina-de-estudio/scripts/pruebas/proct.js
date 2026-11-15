const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:1200,height:900}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
const box=p.locator('#anat-esp');await box.scrollIntoViewIfNeeded();await p.waitForTimeout(1500);
console.log('autoplay step',await box.locator('.anat-info').innerText().then(t=>t.slice(0,40)));
await box.locator('[data-act="next"]').click();await box.locator('[data-act="next"]').click();await p.waitForTimeout(700);
await box.screenshot({path:'proc_paso.png'});
console.log('off count',await box.locator('.pstep.off').count());
// ordena
await box.locator('[data-mode="ordena"]').click();
for(const k of ['cito1','gonia','cito1','cito2','tida','zoide']){await box.locator(`.part[data-part="${k}"]`).first().click({force:true});await p.waitForTimeout(150)}
await p.waitForTimeout(300);console.log('ordena',(await box.locator('.anat-info').innerText()).slice(0,60),'|',await box.locator('.anat-foot').innerText());
// juego
await box.locator('[data-mode="juego"]').click();await p.waitForTimeout(200);
for(let i=0;i<8;i++){const t=await box.locator('.anat-info em').innerText();const key=await p.evaluate(t=>{const b=document.getElementById('anat-esp');return null},t);
  const map={'Tubo seminífero':'tubo','Células de Sertoli':'sertoli','Células de Leydig':'leydig','Espermatogonia':'gonia','Espermatocito I':'cito1','Espermatocito II':'cito2','Espermátida':'tida','Espermatozoide':'zoide'};
  await box.locator(`.part[data-part="${map[t]}"]`).first().click({force:true});await p.waitForTimeout(1250)}
console.log('juego',(await box.locator('.anat-info').innerText()).slice(0,50));
await box.locator('[data-mode="tapar"]').click();await p.waitForTimeout(300);await box.screenshot({path:'proc_tapar.png'});
const o=p.locator('#anat-ovp');await o.scrollIntoViewIfNeeded();await p.waitForTimeout(5000);await o.screenshot({path:'proc_ovp.png'});
const r=await p.evaluate(()=>{const q=BANK.find(x=>x[5]&&x[5].img==='esp'&&x[5].p==='cito2');startQuiz([q]);let e=document.getElementById('quiz');while(e){if(e.hidden)e.hidden=false;e=e.parentElement}return [document.querySelectorAll('#quiz .qpic .plab').length,document.querySelectorAll('#quiz .qpic .pm').length]});console.log('qpic plab,pm',r);
await p.locator('#quiz').scrollIntoViewIfNeeded();await p.locator('#quiz .qpic').screenshot({path:'proc_q.png'});
const ph=await b.newPage({viewport:{width:390,height:844}});ph.on('pageerror',e=>errs.push(e.message));await ph.goto('file://'+process.argv[2]);await ph.waitForTimeout(500);
const pb=ph.locator('#anat-esp');await pb.scrollIntoViewIfNeeded();await ph.waitForTimeout(2500);await pb.screenshot({path:'proc_phone.png'});
console.log('phone scrollW',await ph.evaluate(()=>document.documentElement.scrollWidth),'errs',errs);await b.close()})();
