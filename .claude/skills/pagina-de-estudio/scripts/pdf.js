// Genera el PDF de la guía con Chromium (Playwright ya está instalado en el entorno).
// Uso: node pdf.js <guia.html absoluto> <salida.pdf> "Texto del pie de página"
// La fuente del pie es DejaVu Sans (TrueType) para no generar fuentes Type 3, que hacen lento el PDF en el celular.
const {chromium}=require('playwright');
(async()=>{const [src,out,pie='Guía de estudio']=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+src,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:out,format:'Letter',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<div></div>',
 footerTemplate:`<div style="width:100%;text-align:center;font-size:8px;color:#A79F9C;font-family:DejaVu Sans">${pie} — página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`});
await b.close()})();
