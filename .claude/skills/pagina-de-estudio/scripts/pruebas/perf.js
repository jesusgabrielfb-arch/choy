const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,mob] of [[1200,false],[390,true]]){const p=await b.newPage({viewport:{width:w,height:844},deviceScaleFactor:mob?3:1,isMobile:mob,hasTouch:mob});
const c=await p.context().newCDPSession(p);if(mob)await c.send('Emulation.setCPUThrottlingRate',{rate:4});
const t0=Date.now();await p.goto('file://'+process.argv[2],{waitUntil:'load'});const load=Date.now()-t0;
await p.evaluate(()=>{window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(e.duration))).observe({type:'longtask',buffered:true})});
const fr=await p.evaluate(async()=>{const H=document.documentElement.scrollHeight;let frames=[],last=performance.now();const end=Math.min(H,40000);
 for(let y=0;y<end;y+=600){window.scrollTo(0,y);await new Promise(r=>requestAnimationFrame(()=>{const n=performance.now();frames.push(n-last);last=n;r()}))}
 frames.sort((a,b)=>a-b);return {n:frames.length,p50:frames[frames.length>>1]|0,p95:frames[Math.floor(frames.length*.95)]|0,max:frames[frames.length-1]|0,H}});
const lt=await p.evaluate(()=>window.__lt);console.log(mob?'phone x4':'desk','load',load,'ms frames',JSON.stringify(fr),'longtasks',lt.length,'max',Math.max(0,...lt)|0);
await p.close()}await b.close()})();
