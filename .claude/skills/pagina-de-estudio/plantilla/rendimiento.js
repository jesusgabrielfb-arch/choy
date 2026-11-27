/* ---------- rendimiento: saltos exactos aunque las secciones no estén dibujadas ----------
   Con content-visibility las secciones fuera de pantalla tienen una altura estimada. Antes de cualquier salto
   (menú, botones, lupa, #enlace al abrir) se dibuja todo para que el destino sea exacto; al terminar se vuelve a
   ahorrar y se corrige el desplazamiento para que la sección de destino no se mueva. */
(function(){
  const H=document.documentElement,RMo=matchMedia('(prefers-reduced-motion: reduce)').matches;let t,last=null,endFn=null;
  function off(){clearTimeout(t);if(endFn){removeEventListener('scrollend',endFn);endFn=null}
    const el=last,b=el?el.getBoundingClientRect().top:0;H.classList.remove('cv-off');
    if(el){const a=el.getBoundingClientRect().top;if(Math.abs(a-b)>1)scrollBy({top:a-b,behavior:'instant'})}last=null}
  function on(el){last=el;H.classList.add('cv-off');void H.offsetHeight;clearTimeout(t);t=setTimeout(off,4000);
    if(endFn)removeEventListener('scrollend',endFn);endFn=()=>{clearTimeout(t);t=setTimeout(off,500)};addEventListener('scrollend',endFn)}
  const SI=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(o){on(this);return SI.call(this,o)};
  function go(id,smooth){let el;try{el=document.getElementById(id)}catch(e){}if(!el)return false;el.scrollIntoView({behavior:smooth&&!RMo?'smooth':'auto',block:'start'});return true}
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented)return;const h=a.getAttribute('href');if(h.length<2)return;
    const id=decodeURIComponent(h.slice(1));if(go(id,true)){e.preventDefault();try{history.pushState(null,'','#'+id)}catch(_){}}});
  addEventListener('load',()=>{if(location.hash.length>1)setTimeout(()=>go(decodeURIComponent(location.hash.slice(1)),false),60)});
})();
