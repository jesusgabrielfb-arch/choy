const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:800}});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
for(let y=0;y<60000;y+=700){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(30)}await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const clip=e=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o!=='visible')return true}return false};
return [document.documentElement.scrollWidth,...[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>401.5&&!clip(e)).slice(0,10).map(e=>e.tagName+'.'+e.className.baseVal+e.className+' '+Math.round(e.getBoundingClientRect().right)+' '+(e.closest('section')||{}).id+' '+e.outerHTML.slice(0,90))]});
console.log(r.join('\n'));await b.close()})();
