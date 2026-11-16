---
name: pagina-de-estudio
description: Crea una página de estudio completa e interactiva para un tema escolar nuevo (biología u otra materia), igual a la de "Sistema Reproductor": resumen bonito tipo cuaderno, dibujos interactivos para practicar, procesos animados, práctica por temas con 6 tipos de pregunta, simulacro de examen imprimible, test estilo Daypo, guía PDF, mascotas 3D hechas en Blender que reaccionan y hablan, y publicación en Vercel. Úsala cuando el usuario pida "usa la skill", "hazme otra página como la del reproductor", "una página de estudio / resumen / práctica / simulacro para el tema X", o mande fotos de apuntes o un PPT de un tema nuevo.
---

# Página de estudio (plantilla del "Sistema Reproductor")

Esta skill sirve para hacer **otra página como la de Sistema Reproductor, pero de un tema nuevo**.
La implementación de referencia, que funciona y está probada, está en **dos lugares**:
- dentro de la skill, en `referencia_pagina/`, cuando se instaló desde el .zip (claude.ai u otro proyecto): `sistema-reproductor.html`, `guia.html`, `fonts/`, `mascotas/`, `iconos/`, `blender/`, `vercel.json`;
- en el repo `jesusgabrielfb-arch/choy`, cuando trabajas ahí:

- `estudio/sistema-reproductor/fuente/sistema-reproductor.html` — la página completa (fuente del artefacto, sin doctype).
- `estudio/sistema-reproductor/fuente/guia.html` — la fuente de la guía PDF (usa `fonts/`).
- `estudio/sistema-reproductor/index.html`, `vercel.json`, `manifest.webmanifest`, `iconos/`, `mascotas/` — lo que se publica en Vercel.
- `estudio/sistema-reproductor/blender/` — los scripts que modelan y animan a las mascotas.

**No empieces desde cero:** copia la página de referencia, conserva el motor (CSS, JS de práctica, simulacro, test, mascotas, dibujos) y **cambia el contenido**. En `referencia.md` está el mapa de cada parte del archivo y qué hay que cambiar.

Habla siempre en español, en tono cercano. El usuario es estudiante y la nota va **del 1 al 5**.

## Paso 0 — Preguntas al empezar (siempre)

Apenas se invoque la skill, **antes de hacer nada**, pregunta con `AskUserQuestion`: máximo 4 preguntas por llamada, cada una con 2 a 4 opciones; pon primero la recomendada, con "(Recomendado)" al final. Haz tres rondas cortas.

**Ronda 1**
1. **Tema y material:** ¿Qué tema es y qué material tienes? Opciones: "Fotos de mis apuntes", "PPT de clase", "Las dos cosas (Recomendado)", "Solo el nombre del tema". Explica que si hay PPT, **lo del PPT manda** sobre los apuntes.
2. **Profe y escuela:** ¿Cómo se llama tu profe (para las frases de las mascotas) y qué escala de notas usan? Por defecto: 1 a 5.
3. **Mascotas:** "Reusar a Spermi y Ovulina", "Crear 2 personajes nuevos del tema en Blender (Recomendado)", "Sin mascotas". Si son nuevos, en la ronda 2 pide sus nombres y cómo se ven.
4. **Colores y fondo:** muestra antes las vistas de `plantilla/vistas/*.jpg` con SendUserFile y ofrece 3 o 4 paletas que **no estén en `paletas-usadas.md`** y que vayan con el tema (lista en "Paso 4"). Pon primero la que mejor quede con el tema, con "(Recomendado)".


**Ronda 2**
1. **Personajes**, si son nuevos: nombres, aspecto (colores, accesorios como los lentes de Spermi), personalidad y si dicen malas palabras suaves cuando los tocan mucho.
2. **Qué incluir** (multiSelect): resumen con dibujos interactivos, procesos animados, práctica por temas, simulacro, test estilo Daypo, guía PDF y calculadora o ejercicios numéricos si el tema los tiene. Como solo caben 4 opciones, agrúpalas: "Resumen + dibujos + procesos", "Práctica + test Daypo", "Simulacro + guía PDF", "Ejercicios numéricos".
3. **Publicación:** "Vercel, proyecto nuevo (Recomendado)", "Solo artefacto de Claude", "Las dos".
4. **Nombre del sitio:** el que va en la pantalla de inicio (ej. "Reproductor"), la firma "by: …", y si quiere un *easter egg* en la firma (como la foto de Brad Pitt).

**Ronda 3** (una pregunta): la **fecha del examen**, para decidir cuánto contenido y cuántas preguntas hacer.

Si el usuario manda archivos sin contestar, lee el material igual y deduce lo que puedas. No lo bloquees.

## Paso 1 — Leer el material

- **Fotos de apuntes:** léelas con la herramienta Read. Transcribe y ordena por temas.
- **PPT (.ppt/.pptx):** conviértelo con `soffice --headless --convert-to pdf` o `--convert-to pptx`, y saca el texto con `pdftotext` o python-pptx. Saca imágenes de cada lámina con `pdftoppm -r 110 -png` y míralas.
- **Regla de oro:** si el PPT y los apuntes no coinciden, **gana el PPT**. Marca cada corrección con la caja `.fix` ("corregido según el PPT", explicando qué decían los apuntes) y el chip `c-ppt`.
- Lo que no esté en el material y agregues porque ayuda (por ejemplo, la criptorquidia), márcalo como **"Dato extra (no está en el PPT)"**.
- Arma la lista de **temas** del índice y, para cada uno, sus **subtemas**. Los vas a necesitar para `TOPICS` y `SUBT`.

## Paso 2 — Construir la página (copiando la referencia)

Trabaja en el scratchpad: copia `fuente/sistema-reproductor.html` a `<scratchpad>/<tema>/<tema>.html` y guarda un backup antes de cada cambio grande (`backup_pre_X.html`). Haz los cambios con scripts de Python que reemplazan texto y comprueban que el original aparece exactamente una vez (`assert s.count(a)==1`). Así nunca rompes algo sin darte cuenta.

Orden recomendado (detalle en `referencia.md`):

1. **Hero y navegación:** título, la firma "by: …" con el mismo tipo de letra en más pequeño, el anillo de progreso (`SECS` en el JS) y los enlaces del menú. El cursor especial del hero (ovocito con espermatozoides que lo siguen) solo existe en computadora; en celular o iPad se ve normal. Adáptalo al tema o quítalo.
2. **Secciones del resumen:** una `<section class="topic reveal" id="...">` por tema, con definiciones (`.def`), tablas (`.tbl`), notas (`.sticky`), comparaciones (`.vs`) y los chips *Seguro / Muy probable / Extra / PPT*. Al final de cada sección van los botones "Practicar este tema" (`data-prac`) y "Lo tengo" (`data-done`).
3. **Dibujos interactivos** (`makeAnat`): SVG realista y limpio, con modos **Ver / Tapar nombres / Juego: toca la parte**. Haz uno por cada estructura importante del tema.
4. **Procesos animados** (`makeProc`): cada proceso o ciclo del tema, con modos **Paso a paso** (se reproduce solo al verlo) / **Tapar nombres** / **Juego: toca la etapa** / **Ordena el proceso**.
5. **Banco de preguntas** (`BANK`): 6 tipos. Ver "Preguntas" abajo.
6. **Tarjetas** (`CARDS`) y **repaso tapado** (`REV`).
7. **Simulacro** (`SIM`, `SIM_IMG`, `LBL`).
8. **Test estilo Daypo** (`S` = escenas animadas y `scene(q)` = qué escena va con cada pregunta).
9. **Buscador (lupa):** pega `plantilla/buscador.css` al final del primer `<style>` y `plantilla/buscador.js` en un `<script>` al final de la página. Agrega un botón flotante con una lupa (abajo a la derecha) que también se abre con la tecla `/` o Ctrl/Cmd+K. Busca sin tildes en:
   - todo el resumen: títulos, definiciones, listas, tablas, notas y los nombres de los dibujos;
   - los términos clave (`REV`);
   - las preguntas de `BANK`, que muestran la respuesta al tocarlas.

   Al elegir un resultado, baja hasta ese lugar, lo resalta y **subraya la palabra buscada** (resaltador amarillo con línea ondulada) en toda esa sección, también en los nombres de los dibujos, durante 15 segundos; si es una parte de un dibujo, además la selecciona. Funciona solo, sin configurar nada, si la página usa `section.topic`, `REV`, `BANK` y `TOPICS`.
10. **Cuadros para practicar** ("llena el cuadro"): pega `plantilla/tabla-practica.css` en el `<style>` y `plantilla/tabla-practica.js` en un `<script>` al final. A **cada cuadro de comparación** ponle `data-practica` en su `<div class="tbl">`. Así tiene dos botones, "Ver cuadro" y "✎ Practicar: llena el cuadro": las casillas se vacían, aparece un banco con las respuestas mezcladas, tocas una respuesta y luego su casilla, y "Comprobar" pone verde y rojo, muestra la correcta y da la nota del 1 al 5. Hay tres modos:
   - `celdas`: la primera columna es el nombre de la fila y cada casilla tiene su lugar exacto (ej. espermatogénesis vs. ovogénesis, tabla de fases);
   - `columna`: basta con que cada frase quede en la columna correcta (ej. cesárea vs. parto);
   - `derecha`: solo se vacía la última columna (ej. "No te confundas").
11. **Mascotas:** frases (`PHR`, `YAI` con el nombre del profe, `TIPS`) y reacciones.

### Preguntas (lo más importante para el usuario)

- **Tipos:** `mc` (selección múltiple, la correcta va **primero** en el arreglo), `tf`, `fill` (llenar espacios con `___`; respuestas como lista de alternativas; `{any:true}` si el orden de los espacios no importa), `match` (pareo; **las respuestas de la derecha deben ser todas distintas**), `order` y `open` (desarrollo, con palabras clave `"a|b"`).
- **Preguntas con imagen:** `["mc",tema,"¿Qué parte está marcada…?",[correcta,…],explicación,{img:"<id del dibujo>",p:"<parte>"}]`. `picHTML` clona el dibujo, quita los nombres y pone un círculo que late sobre la parte. Agrega las coordenadas de esa parte en el mapa de anclas.
- **Cantidad:** apunta a **40 o más por tema**, con todos los tipos: unas 8 de llenar espacios, 2 o 3 pareos, 2 órdenes y 2 de desarrollo por tema. Cubre **todos** los subtemas (al usuario le molestó que salieran pocas de glándulas anexas).
- **`SUBT`:** expresiones regulares por subtema para cada tema, de la más específica a la más general. `balanced()` reparte tipos y subtemas al armar cada ronda. Revisa con `pruebas/fbal.js` que casi nada caiga en "otro".
- Ronda por defecto: **25 preguntas**.

## Paso 3 — Mascotas en Blender

Si las mascotas son nuevas, usa `scripts/blender/build.py` como base (modela con primitivas y bmesh, materiales Principled, cámara, luces y 7 animaciones).

- Instala Blender como módulo: `python3 -m venv <scratchpad>/bl && <scratchpad>/bl/bin/pip install bpy pillow`. Lo que se usó fue bpy 5.2 con Python 3.13. Renderiza con **Cycles en CPU**.
- Animaciones: `idle, happy, sad, dance, spin, love, angry`, cada una de **48 frames a 24 fps** (así no se ven trabadas).
- `python build.py <personaje> <outdir> preview` sirve para revisar rápido; después haz el render completo. Luego `python sheets.py <outdir> <destino>` convierte los frames en hojas WebP de 200 px.
- En la página, la animación usa `steps(48)`. Las animaciones de una sola vez usan `spriteOnce`, que termina en el frame 47 con `jump-none`, y al terminar vuelven a `idle` con `animationend`. Antes de reproducir, `ensure()` decodifica la imagen.
- **Reacciones:**
  - feliz o triste al responder;
  - enojo después de **3 errores seguidos** (con frases del profe: "la profe se va a molestar", "te vas a quedar en…");
  - enojo y malas palabras suaves si los tocan muchas veces seguidas;
  - frases variadas mientras se practica, sin repetir la misma animación al tocarlos.
- **Problemas ya resueltos:**
  - el emparentado perdía la escala: llama `view_layer.update()` antes de copiar `matrix_world`;
  - los lentes oscuros se veían grises: usa `Specular IOR Level=0`, `coat=0`, `alpha=1` y un brillo diagonal emisivo;
  - el personaje desaparecía al terminar una animación: arréglalo con `spriteOnce` y `jump-none`;
  - lentes redondos rechazados: el usuario prefirió tipo wayfarer.
- Haz también el **ícono** para la pantalla de inicio: un SVG con algo que tenga sentido para el tema (en el reproductor, un ovocito con espermatozoides llegando). Renderízalo a 512, 192, 180 y 32 px con `pruebas/render_svg.js` y guárdalo en `iconos/`.

## Paso 4 — Diseño (no debe parecer hecho por IA)

**Cada página tiene su propia identidad visual. Nunca repitas la del reproductor tal cual.**
- Pega `plantilla/temas-visuales.css` al final del primer `<style>` y activa la paleta con `document.body.classList.add('paleta-…')`, al inicio del script o en el `<body>` de Vercel.
- **Paletas** (todas claras):

  | Paleta | Colores | Va bien con |
  |---|---|---|
  | `durazno` | coral + salvia | sistema reproductor (ya usada) |
  | `oceano` | turquesa + durazno | agua, respiración, circulación, ecosistemas marinos |
  | `bosque` | verde hoja + miel | plantas, fotosíntesis, ecología, célula vegetal |
  | `lavanda` | violeta + menta | sistema nervioso, genética, células |
  | `girasol` | mostaza + celeste | química, energía, nutrición, digestivo |
  | `cereza` | frambuesa + azul | circulatorio, sangre, corazón, inmunidad |
  | `arena` | caramelo + verde agua | historia, geografía, evolución |
  | `menta` | verde menta + azul | física, matemáticas, respiratorio |

  Si ninguna sirve, crea una nueva copiando el bloque de una paleta y cambiando los tokens. Mantén el contraste del texto y nada de fondos oscuros.
- **Un fondo distinto para cada tema (sección):** pon `data-fondo` en cada `<section class="topic">` y altérnalos: `cuadricula`, `rayado`, `puntos`, `milimetrado`, `kraft`, `isometrico`, `hexagonos` (química), `acuarela`, `pentagrama`. Con `data-acento="alt"` en secciones alternas, el número y el subrayado de esa sección toman el segundo color de la paleta.
- Cambia también los colores de las cintas washi (`--tape1..3`), el ícono y los colores de los dibujos para que combinen con la paleta.
- Al terminar, **anota la paleta y los fondos en `paletas-usadas.md`**.

- Tema claro y tranquilo: papel de cuaderno con cuadrícula, línea roja de margen, cintas washi y notas adhesivas. **Nada de azul oscuro.** Usa los tokens de `:root` de la referencia.
- Fuentes: *Instrument Serif* (títulos), *Figtree* (texto) y *Gochi Hand* (notas a mano).
- Animaciones suaves (reveal al hacer scroll, subrayador, confeti) que respeten `prefers-reduced-motion`.
- **Nada debe tapar nada:** las etiquetas de los dibujos no se pisan, las líneas guía no cruzan nombres y los marcadores de flecha usan `markerUnits="userSpaceOnUse"`. Revisa siempre con capturas.
- En celular: sin desplazamiento lateral (`html,body{overflow-x:clip}`); los diagramas anchos van dentro de un contenedor que se desliza, con el aviso "Desliza para verlo completo →".

## Paso 5 — Guía PDF

Copia `fuente/guia.html` y adapta el contenido (portada, índice, secciones, repaso y autoevaluación con respuestas). Pega los mismos SVG de la página, pero sin la textura `feTurbulence`, sin el texto "?" y sin animaciones.

```bash
node scripts/pdf.js "$PWD/guia.html" "$PWD/guia_tmp.pdf" "Tema · Guía de estudio"
python3 scripts/optimizar_pdf.py guia_tmp.pdf guia-de-estudio.pdf
pdffonts guia-de-estudio.pdf   # NO debe haber "Type 3"
```

Para que el PDF no sea lento en el celular:
- **fuentes TrueType estáticas**: las de `plantilla/fuentes/` o las que genera `fuentes_estaticas.py`; las variables de Google se vuelven Type 3;
- la cuadrícula del fondo como **una sola imagen** (`grid.png`);
- **sin bordes punteados**, porque cada punto se vuelve una línea;
- el PDF **linealizado**.

Revisa las páginas con `pdftoppm -r 45` y una hoja de contacto.

## Paso 6 — Pruebas (siempre antes de publicar)

Los scripts de `scripts/pruebas/` se corren con node y reciben la ruta absoluta de la página. Adapta los selectores si cambian los ids.

- `shot.js`: no hay errores de JS y `scrollWidth` es igual al ancho en computadora (1200) y en celular (400).
- `ptest.js`: el banco es válido (`bad []`) y una ronda completa recorre los 6 tipos sin errores. Si el banco crece, sube el límite del bucle.
- `dptest.js`: el test Daypo funciona. `simtest.js`: el simulacro tiene 30 líneas de pareo, 2 casos y 3 imágenes. `proct.js`: los procesos animados funcionan. `lupa.js`: el buscador abre, encuentra, lleva al lugar y se cierra con Esc. `fbal.js`: el reparto por tipo y subtema es bueno.
- Mira las capturas de los dibujos nuevos con Read, en computadora y en celular (390 px).

## Paso 7 — Publicar

1. **Artefacto:** publícalo con la herramienta Artifact y conserva el mismo `file_path` para que el link no cambie.
2. **Vercel:**
   - Crea la carpeta `estudio/<tema>/` en el repo con `index.html`, `vercel.json`, `manifest.webmanifest`, `iconos/`, `mascotas/` y `guia-de-estudio.pdf`. El `index.html` sale de: `python3 scripts/a_vercel.py <pagina.html> estudio/<tema>/index.html --nombre … --titulo … --descripcion … --url https://<proyecto>.vercel.app --pdf guia-de-estudio.pdf`.
   - `vercel.json` estático: `{"buildCommand":"echo pagina estatica","installCommand":"echo sin dependencias","outputDirectory":"."}`.
   - Crea el proyecto en Vercel con `rootDirectory` = `estudio/<tema>`, framework null y **sin protección SSO** (`ssoProtection: null`), para que se pueda abrir sin cuenta.
   - Haz commit (con las líneas de atribución que pida el sistema), push a la rama asignada y despliega con `mcp__Vercel__create_deployment` usando `gitSource` (`org`, `repo`, `ref` y `sha` del commit) y `target: "production"`. Espera a que `get_deployment` diga `READY`.
3. Anota la paleta y los fondos en `paletas-usadas.md` (de la skill).
4. Guarda también la fuente en `estudio/<tema>/fuente/`, porque el scratchpad se borra.
5. **Al terminar, pásale SIEMPRE los links al usuario:** página, `#simulacro`, `#test`, guía PDF y artefacto.

## Cosas que el usuario pidió en el reproductor (repítelas sin que las pida)

- La práctica por tema mezcla los 6 tipos y cubre todos los subtemas; también se puede practicar con todos los temas a la vez.
- Simulacro:
  - se genera, se guarda en el navegador, se puede imprimir y se puede hacer en la página;
  - incluye un pareo de unas 25 palabras y 30 líneas con letras (palabras que se repiten o sobran), respuesta corta (no llenar espacios), 2 casos clínicos, 3 imágenes, comparación entre conceptos y 1 pregunta de nivel alto.
- Test estilo Daypo: todas las preguntas a la vista, con una animación de cada concepto. Los nombres de la animación se ocultan hasta responder, para no regalar la respuesta.
- Nombres alternativos siempre juntos, por ejemplo "glándula bulbouretral (de Cowper)".
- El ícono y el nombre corto para la pantalla de inicio.
- Colores y fondos diferentes en cada página nueva y en cada tema dentro de la página.
- La lupa para buscar términos en toda la página.
- Todos los cuadros de comparación se pueden practicar (llenar el cuadro con un banco de respuestas).
- Las explicaciones de los procesos, con imágenes y animaciones que se puedan practicar ahí mismo.
- Si el tema tiene cálculos, el método **exacto de la clase**. En el reproductor: la ovulación es la fecha del primer día **+** la mitad del ciclo, sin restar 1. Pregúntalo si no está claro.

## Usar la skill en otro chat

- **Claude Code** (web, app o terminal) con el repo `choy`: la skill vive en `.claude/skills/pagina-de-estudio/` de la rama donde se creó. Para que salga en **todas** las sesiones nuevas, esa rama tiene que estar unida a la rama principal (con un pull request). Mientras tanto, abre la sesión sobre esa rama. Se invoca con `/pagina-de-estudio` o diciendo "usa la skill de página de estudio".
- **claude.ai** (chat normal) **u otro proyecto:** genera el .zip autónomo con `bash scripts/empaquetar.sh <repo-choy> pagina-de-estudio.zip` y súbelo en la configuración de Claude, en la sección de Skills (o cópialo a `.claude/skills/` del otro proyecto). En claude.ai hay que tener activada la ejecución de código. Allí no hay acceso al repo, así que usa `referencia_pagina/`, y para publicar en Vercel hace falta el conector de Vercel.
- Si se cambia la skill, vuelve a generar el .zip y súbelo de nuevo.
