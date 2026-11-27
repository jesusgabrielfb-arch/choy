const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for (const [w,name,dark] of [[1200,'desk',false],[400,'phone',true]]){
const p=await b.newPage({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
console.log(name,'errors',errs,'scrollW',await p.evaluate(()=>document.documentElement.scrollWidth));
await p.screenshot({path:name+'.png',fullPage:true});}
await b.close()})();
