# Mapa de la página de referencia

Archivo: `estudio/sistema-reproductor/fuente/sistema-reproductor.html` (unas 3700 líneas, sin `<!doctype>`; el artefacto lo envuelve).
Busca cada parte con `grep -n` usando los marcadores de la izquierda.

## CSS (dentro del primer `<style>`)

| Marcador | Qué es | ¿Cambiar? |
|---|---|---|
| `:root{` | Colores (tokens), fuentes, sombras | Solo si el tema pide otra paleta (mantenla clara) |
| `/* ---------- nav ---------- */` | Menú fijo, marca "Título ✿ / by: …" | Textos |
| `/* ---------- hero ---------- */` | Portada, anillo de progreso, mascotas grandes | Textos |
| `/* ---------- notebook pages ---------- */` | Hojas de cuaderno, cintas, margen | No |
| `.anat`, `.proc`, `.qpic` | Dibujos interactivos, procesos y preguntas con imagen | No |
| `.mascot`, `@keyframes sprite`, `spriteOnce` | Hojas de sprites de las mascotas | Solo las rutas `mascotas/<nombre>_<anim>.webp` |
| `.reveal.pre` + `html,body{overflow-x:clip}` | Animación al hacer scroll sin desplazamiento lateral en celular | No |

## HTML

| Marcador | Qué es |
|---|---|
| `<nav class="nav"` / `id="navrow"` | Enlaces `data-sec` a cada sección + botones Practicar, Simulacro y Test |
| `<header class="hero"` / `id="stage-hero"` | Portada con mascotas, lema y botones |
| `<!-- 1 BASE -->` … `<!-- 11 CONFUSIONES -->` | Una sección por tema: **aquí va el contenido nuevo** |
| `<div class="anat" id="anat-…">` | Dibujo interactivo: botones de modo + `<svg>` con `<g class="part" data-part="…">` + `<g id="anat-labels">` |
| `<div class="anat proc" id="anat-…">` | Proceso animado: `<g class="pstep" data-step="N">`, `<g class="part">`, `<g class="plab" data-lab="…">` con textos `.nm` / `.q` / `.sub` |
| `<!-- PRACTICA -->` | Configuración (temas, modo, tipos, cantidad), tarjetas, quiz y repaso |
| `id="simulacro"` | Simulacro de examen |
| `id="test"` | Test estilo Daypo |

## JavaScript (segundo `<script>`)

| Marcador | Qué es | Qué cambiar |
|---|---|---|
| `const store=` | localStorage seguro (try/catch) | Prefijos de las claves (`repro-…` → `<tema>-…`) |
| `/* ---------- hero: espermatozoides … */` | Cursor especial del hero, solo en computadora | Adaptarlo al tema o quitarlo |
| `/* ---------- mascotas */`, `const PHR`, `const YAI`, `const TIPS`, `function react` | Frases y reacciones | **Frases nuevas del tema y del profe** |
| `const SECS=` | Secciones que cuentan para el anillo "x/11" | ids de las secciones |
| `function makeAnat(boxId,P,ACCEPT,opts)` | Motor de dibujos. `P={clave:{n:nombre,d:descripción,a:[x,y] ancla,l:[x,y] caja de la etiqueta}}` | Solo las llamadas `makeAnat('anat-…',{…})` |
| `function makeProc(boxId,C,opts)` | Motor de procesos. `C={steps:[[título,html]…],parts:{clave:[nombre,desc,paso]},order:[claves en orden]}` | Solo las llamadas `makeProc(…)` |
| `const MASC_P`, `OVO_P`, `ESP_P`, `OVP_P` + `function picHTML` | Anclas de las preguntas con imagen | Mapa `{img: ANCLAS}` dentro de `picHTML` |
| `/* ---------- gráfica del ciclo */`, `calculadora`, `práctica de cálculo` | Herramientas propias del tema | Reemplazar o quitar |
| `const TOPICS=` | `{clave:['Nombre','#seccion']}` | **Temas nuevos** |
| `const BANK=[` | Banco de preguntas (ver formatos abajo) | **Todo** |
| `const CARDS=[`, `const REV=[` | Tarjetas `[pregunta,respuesta,tema]` y repaso `[término,frase,tema]` | **Todo** |
| `const TYPES=`, `const SUBT=`, `function balanced` | Tipos y reparto por subtema | `SUBT` del tema nuevo |
| `function fillOk`, `function gradeFill` | Llenar espacios (sin tildes, plural, errores pequeños) | No |
| `/* ---------- simulacro de examen */ const SIM=` | `terms` (pareo), `short` (respuesta corta), `cases` (casos), `compare`, `high` | **Todo** |
| `const SIM_IMG=`, `const LBL=` | Imágenes del simulacro: partes numeradas y posición de cada número | Del tema nuevo |
| `/* ---------- test estilo Daypo */ const S={` + `function scene(q)` | Mini animaciones SVG por concepto y regex que las eligen | **Escenas del tema** |
| `function rng(seed)` (mulberry32), `newExam` | Simulacros con semilla, guardados en `localStorage` | Clave de guardado |

## Formatos del banco

```js
["mc","tema","Pregunta",["correcta","d1","d2","d3"],"Explicación"]              // opcional 6.º: {img:"masc",p:"prostata"}
["tf","tema","Afirmación",true,"Explicación"]
["fill","tema","Texto con ___ y ___.",[["resp1","alt1"],["resp2"]],"Explicación"]  // opcional 6.º: {any:true}
["match","tema","Une…",[["izq","der"],…]]          // las de la derecha, todas distintas
["order","tema","Ordena…",["1.º","2.º",…],"Explicación"]
["open","tema","Pregunta",["Respuesta modelo"],["clave1|sinónimo","clave2"]]
```

## Pasos para añadir un dibujo interactivo nuevo

1. Dibuja el SVG en Python (scripts generadores, como en `masc/gen.py` del reproductor): gradientes radiales, filtro `feTurbulence` para dar textura y `feDropShadow`. Envuelve cada estructura en `<g class="part" data-part="clave">`; las partes delgadas llevan una `<path class="hit" stroke="transparent" stroke-width="16">` para que sean fáciles de tocar.
2. Elige anclas (`a`) dentro de cada parte y cajas de etiqueta (`l`) que no se crucen. El ancho de la caja es `len(nombre)*7.3+18`. Renderiza una vista previa con `pruebas/render_svg.js` y mírala.
3. Inserta el bloque `.anat`, llama `makeAnat`, agrega las anclas a `picHTML`, preguntas de imagen al `BANK` y, si quieres, una entrada en `SIM_IMG` y `LBL`.
4. Prueba que tocar cada ancla dé la parte correcta, con `document.elementFromPoint` en modo juego.

## Errores que ya pasaron (no los repitas)

- La clase `.back` chocaba con la tarjeta `.face.back`; ahora es `.pback`.
- Los `.hit` clonados salían como círculos negros en el simulacro: `cloneSvg` y `picHTML` los quitan.
- Las animaciones del Daypo regalaban la respuesta: el texto del SVG se oculta hasta responder.
- `contain-intrinsic-size` hacía que las tarjetas se salieran en celular: usa `contain-intrinsic-block-size` y `min-width:0`.
- Un `rotate()` en `.reveal.pre` sobre secciones altas causaba desplazamiento lateral: usa `html,body{overflow-x:clip}`.
- Una coma faltante en `SIM.cases` rompió todo el JS: revisa siempre con `shot.js`, que muestra los errores.
- La cuadrícula del PDF con gradientes CSS generaba miles de piezas: usa una imagen.
- Las fuentes variables y las OTF salían como Type 3 (PDF lento): usa TTF estáticas.
- Las etiquetas que quedaban debajo de otra figura (por ejemplo "hueso del pubis") hay que moverlas y añadirles una línea guía.
- Una glándula mal conectada (bulbouretral): revisa la anatomía de cada conducto que dibujes y dónde desemboca.
