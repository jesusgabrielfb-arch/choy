const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [W,H]=[+process.argv[4],+process.argv[5]];const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
await p.setContent(`<style>body{margin:0;background:#fff}svg{width:${W}px;height:${H}px;display:block}</style>${fs.readFileSync(process.argv[2],'utf8')}`);await p.screenshot({path:process.argv[3]});await b.close()})();
