/* ---------- hero: hormonas viajando por la sangre hacia su célula diana ---------- */
(function(){
  const cv=document.getElementById('swim'),ctx=cv.getContext('2d');let W,H,dpr,sp=[],t=0,vis=true,raf,COL={},TGT=null,skip=0;
  const FINE=matchMedia('(hover: hover) and (pointer: fine)').matches,M={on:false,x:0,y:0},cur=document.getElementById('ovo-cursor'),card=cv.closest('.hero-card');
  function cols(){COL={ink:css('--ink'),coral:css('--coral'),blue:css('--blue'),hl:css('--hl'),hl2:css('--hl2'),page:css('--page')};COL.list=[COL.coral,COL.blue,'#E3B33C','#E58BA0']}
  function measure(){const o=document.querySelector('#stage-hero .mascot[data-who="insulina"]');if(o){const a=o.getBoundingClientRect(),c=cv.getBoundingClientRect();TGT={x:a.left-c.left+a.width*.5,y:a.top-c.top+a.height*.5,r:a.width*.2,hide:true}}else TGT=null}
  function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function tgt(){if(M.on)return{x:M.x,y:M.y,r:16,hide:true};return TGT||{x:W*.86,y:H*.22,r:Math.max(40,Math.min(W,H)*.1)}}
  function spawn(s,init){const e=tgt();if(M.on&&!init){const side=Math.floor(Math.random()*4);s.x=side===0?-30:side===1?W+30:Math.random()*W;s.y=side===2?-30:side===3?H+30:Math.random()*H}else{s.x=init?Math.random()*W*.7:-40-Math.random()*200;s.y=H*.12+Math.random()*H*.82}
    s.a=undefined;s.v=.5+Math.random()*.55;s.ph=Math.random()*6.28;s.c=Math.floor(Math.random()*4);s.r=4.5+Math.random()*2.5;s.rot=Math.random()*6;return s}
  function init(){size();cols();measure();sp=[];const n=W<600?9:16;for(let i=0;i<n;i++)sp.push(spawn({},true))}
  function hex(x,y,r,rot){ctx.beginPath();for(let i=0;i<6;i++){const a=rot+i*Math.PI/3;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a))}ctx.closePath()}
  function draw(){
    ctx.clearRect(0,0,W,H);const e=tgt();
    // vaso sanguíneo de fondo (curva suave)
    ctx.save();ctx.globalAlpha=.10;ctx.lineWidth=Math.max(46,H*.16);ctx.lineCap='round';ctx.strokeStyle=COL.coral;
    ctx.beginPath();ctx.moveTo(-40,H*.78);ctx.bezierCurveTo(W*.3,H*.55,W*.55,H*.95,W+40,H*.55);ctx.stroke();ctx.restore();
    if(!e.hide){ctx.save();ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,6.283);ctx.fillStyle=COL.hl2;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=COL.blue;ctx.stroke();
      for(let i=0;i<8;i++){const a=i/8*6.283+t*.003,x=e.x+Math.cos(a)*e.r,y=e.y+Math.sin(a)*e.r;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10);ctx.stroke()}ctx.restore()}
    sp.forEach(s=>{
      const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy),ta=Math.atan2(dy,dx);if(s.a===undefined)s.a=ta;let da=ta-s.a;da=Math.atan2(Math.sin(da),Math.cos(da));s.a+=da*(M.on?.09:.04);const ang=s.a+Math.sin(t*.025+s.ph)*.3;
      ctx.save();ctx.globalAlpha=.5;hex(s.x,s.y,s.r,s.rot+t*.01);ctx.fillStyle=COL.list[s.c];ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=COL.page;ctx.stroke();ctx.restore();
      if(!RM){const k=(slow?2:1)*(M.on?1.9:1);s.x+=Math.cos(ang)*s.v*k;s.y+=Math.sin(ang)*s.v*k}
      if(d<e.r+10){if(M.on&&cur){cur.classList.remove('hit');void cur.offsetWidth;cur.classList.add('hit')}spawn(s,false)}
    });
  }
  const slow=innerWidth<700;function loop(){if(!slow||(skip^=1)){t+=slow?2:1;draw()}if(vis&&!RM)raf=requestAnimationFrame(loop)}
  init();draw();if(!RM)loop();
  if(FINE&&card&&cur){
    card.classList.add('ovo-on');
    const move=e=>{const r=cv.getBoundingClientRect();M.x=e.clientX-r.left;M.y=e.clientY-r.top;cur.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`};
    card.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;M.on=true;move(e);cur.classList.add('on')});
    card.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;if(!M.on){M.on=true;cur.classList.add('on')}move(e)});
    card.addEventListener('pointerleave',()=>{M.on=false;cur.classList.remove('on','down')});
    card.addEventListener('pointerdown',()=>cur.classList.add('down'));
    addEventListener('pointerup',()=>cur.classList.remove('down'));
    addEventListener('scroll',()=>{if(M.on){M.on=false;cur.classList.remove('on')}},{passive:true});
  }
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{init();draw()},150)});addEventListener('load',()=>{measure()});
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;cancelAnimationFrame(raf);if(vis&&!RM)loop()}).observe(cv);
})();
