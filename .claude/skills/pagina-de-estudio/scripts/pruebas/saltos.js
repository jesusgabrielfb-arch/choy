const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
for(const id of (process.argv[3]||'base').split(',')){await p.click(`.nav a[href="#${id}"]`);
 for(const w of [300,1500,4000]){await p.waitForTimeout(w);console.log(id,w,await p.evaluate(id=>[document.getElementById(id).getBoundingClientRect().top|0,scrollY|0,document.documentElement.className,document.documentElement.scrollHeight],id))}}
await b.close()})();
