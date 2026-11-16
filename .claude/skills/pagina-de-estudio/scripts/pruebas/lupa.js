const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,n] of [[1200,900,'d'],[390,844,'p']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
await p.click('.lupa-btn');await p.waitForTimeout(300);await p.fill('.busca-top input','prostata');await p.waitForTimeout(300);
console.log(n,'results',await p.locator('.busca-item').count());await p.screenshot({path:`lupa_${n}.png`});
await p.fill('.busca-top input','haploide');await p.waitForTimeout(250);
const qi=p.locator('.busca-item').filter({has:p.locator('.ans')}).first();if(await qi.count()){await qi.click();console.log(n,'ans open',await qi.evaluate(e=>e.classList.contains('open')))}
await p.fill('.busca-top input','bulbouretral');await p.waitForTimeout(250);
const r=p.locator('.busca-res h5:has-text("En el resumen") + .busca-item');await r.first().click();await p.waitForTimeout(1200);
console.log(n,'closed',await p.locator('.busca-ov').count(),'hit',await p.locator('.search-hit').count(),'scrollY',await p.evaluate(()=>scrollY));
await p.screenshot({path:`lupa_hit_${n}.png`});
await p.keyboard.press('/');await p.waitForTimeout(200);console.log(n,'slash opens',await p.locator('.busca-ov').count());await p.keyboard.press('Escape');await p.waitForTimeout(300);console.log(n,'esc',await p.locator('.busca-ov').count());
await p.close()}console.log('errs',errs);await b.close()})();
