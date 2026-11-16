const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,n] of [[1200,900,'d'],[390,844,'p']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
await p.click('.lupa-btn');await p.fill('.busca-top input','fructosa');await p.waitForTimeout(300);
await p.locator('.busca-res h5:has-text("En el resumen") + .busca-item').first().click();await p.waitForTimeout(2600);
console.log(n,'found',await p.locator('span.busca-found').count(),'main',await p.locator('.busca-main').count(),'svg',await p.locator('.busca-svg').count());
await p.screenshot({path:`lupa_found_${n}.png`});
await p.click('.lupa-btn');await p.fill('.busca-top input','epididimo');await p.waitForTimeout(300);
console.log(n,'cleared',await p.locator('span.busca-found').count());
await p.locator('.busca-res h5:has-text("Términos clave") + .busca-item').first().click();await p.waitForTimeout(2600);
console.log(n,'found2',await p.locator('span.busca-found').count(),'svg2',await p.locator('.busca-svg').count());
await p.screenshot({path:`lupa_found2_${n}.png`});
// check text intact
console.log(n,'text ok',await p.evaluate(()=>document.querySelector('#masculino').textContent.includes('Epidídimo')));
await p.close()}console.log('errs',errs);await b.close()})();
