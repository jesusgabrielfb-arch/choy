const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const svg=fs.readFileSync('icon.svg','utf8');
for(const s of [512,192,180,32]){const p=await b.newPage({viewport:{width:s,height:s}});await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${s}px;height:${s}px}</style>${svg}`);await p.screenshot({path:`icon-${s}.png`});await p.close()}
await b.close()})();
