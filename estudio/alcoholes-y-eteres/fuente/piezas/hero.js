/* ---------- hero: moléculas flotando (R–OH y R–O–R'); en computadora se acercan al cursor ---------- */
(function(){
  const cv=document.getElementById('swim');if(!cv)return;const ctx=cv.getContext('2d');let W,H,dpr,M=[],vis=true,raf;
  const FINE=matchMedia('(hover: hover) and (pointer: fine)').matches,P={on:false,x:0,y:0},card=cv.closest('.hero-card');
  const COL={c:'#4A4A52',o:'#D9473E',h:'#FFFFFF',b:'#B9AF9C'};
  function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function mk(){const kind=Math.random()<.5?'oh':'eter';return {kind,x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,a:Math.random()*6.28,va:(Math.random()-.5)*.006,s:.7+Math.random()*.6}}
  function init(){size();M=[];const n=W<600?7:13;for(let i=0;i<n;i++)M.push(mk())}
  function atom(x,y,r,f){ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fillStyle=f;ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='rgba(0,0,0,.18)';ctx.stroke();
    ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.35,0,6.283);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill()}
  function bond(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle=COL.b;ctx.stroke()}
  function draw(){ctx.clearRect(0,0,W,H);
    M.forEach(m=>{ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.a);ctx.scale(m.s,m.s);ctx.globalAlpha=.55;
      if(m.kind==='oh'){bond(-26,0,0,0);bond(0,0,15,-14);atom(-26,0,13,COL.c);atom(0,0,11,COL.o);atom(15,-14,7,COL.h)}
      else{bond(-28,6,0,-4);bond(0,-4,28,6);atom(-28,6,12,COL.c);atom(28,6,12,COL.c);atom(0,-4,11,COL.o)}
      ctx.restore()})}
  function step(){M.forEach(m=>{if(P.on){const dx=P.x-m.x,dy=P.y-m.y,d=Math.hypot(dx,dy)||1;if(d<220){m.vx+=dx/d*.03;m.vy+=dy/d*.03}}
      m.vx*=.99;m.vy*=.99;const sp=Math.hypot(m.vx,m.vy);if(sp<.15){m.vx+=(Math.random()-.5)*.05;m.vy+=(Math.random()-.5)*.05}if(sp>1.6){m.vx*=.9;m.vy*=.9}
      m.x+=m.vx;m.y+=m.vy;m.a+=m.va;if(m.x<-40)m.x=W+40;if(m.x>W+40)m.x=-40;if(m.y<-40)m.y=H+40;if(m.y>H+40)m.y=-40})}
  function loop(){step();draw();if(vis&&!RM)raf=requestAnimationFrame(loop)}
  init();draw();addEventListener('resize',()=>{init();draw()});
  if(FINE&&card){card.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();P.on=true;P.x=e.clientX-r.left;P.y=e.clientY-r.top});card.addEventListener('pointerleave',()=>{P.on=false})}
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{vis=es[0].isIntersecting;cancelAnimationFrame(raf);if(vis&&!RM)loop()}).observe(cv);else if(!RM)loop();
})();
