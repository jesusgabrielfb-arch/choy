# En la puerta del horno se quema el pan 🍞🔥

Calculadora de notas para el portal **SEDUCA** (escala 1.0 a 5.0, nota mínima 3.0).
Subes las capturas de **Notas por materia y periodo** y la página:

1. **Lee las capturas sola** (OCR en tu propio dispositivo, nada se sube a un servidor).
2. Detecta qué **bimestre** es cada una, las **materias** y **cada nota**.
3. Calcula tus promedios **igualito que el portal** y te dice **cuánto necesitas para no quedarte**.
4. Te deja **simular** lo que falta: notas diarias, apreciación y el examen bimestral.

Todo en una cocina 3D con **Pancracio**, un pan medio quemado que se tuesta según tus notas,
te echa porras si vas mal y te recuerda no confiarte si vas bien.

## Cómo se calcula

| Parte | Peso |
| --- | --- |
| Notas diarias (Digitación) | 33.33 % |
| Apreciación | 33.33 % |
| Examen bimestral | 33.33 % |

- Cada parte se promedia y luego las tres partes entre sí.
- El portal **trunca** a un decimal (4.75 → 4.7), no redondea. Verificado con capturas reales:
  la página reproduce exactamente todos los promedios que muestra SEDUCA.
- `X` (exonerado) y `-` (sin calificar) no cuentan.
- Año = promedio de los 4 bimestres. Pasas con **3.0**.

## Cómo leer las capturas (motor)

`src/engine/` — funciona en el navegador y en Node:

1. `vision.js` detecta por color cada insignia de nota y celda de promedio (la escala de
   colores del portal), sin fundir celdas vecinas aunque la captura esté reducida o comprimida.
2. Se borran las insignias y Tesseract (español) lee solo el texto: encabezados, materias y
   el bimestre. El número romano del bimestre se confirma contando sus trazos.
3. Cada insignia se ubica en su fila (materia) y columna (Digitación, Apreciación, Bimestral, Prom.).
4. Todos los números se leen en **una sola pasada** de OCR y se validan con el color de su
   insignia y con los promedios del propio portal; si algo no cuadra, se corrige el único
   dígito que lo hace cuadrar o se marca para revisión.

Precisión con capturas reales de iPad: 308/308 notas, 4/4 bimestres y 11/11 materias,
~2 s por captura. También probado con capturas reducidas a la mitad y comprimidas tipo WhatsApp.

## Usarla

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sale en dist/
npm test         # pruebas de cálculo y lectura
```

`npm run dev` y `npm run build` copian Tesseract y el idioma español a `public/ocr/`
(script `scripts/copy-ocr-assets.mjs`), así la página no depende de CDNs.

### Publicar en Vercel

Importa el repositorio en Vercel: detecta Vite solo y usa `vercel.json`
(`npm run build` → `dist`). No necesita variables de entorno.

### Pruebas con tus capturas

Las capturas tienen datos personales, por eso **no se suben** al repositorio.
Para correr la prueba de lectura real, pon en `tests/private/` las imágenes `b1.png`…`b4.png`
y un `truth.json` con las notas esperadas (la carpeta está en `.gitignore`).

## Estructura

```
src/
  engine/   lector de capturas (visión + OCR)
  grades/   cálculo idéntico al portal y datos guardados en el dispositivo
  three/    cocina 3D y Pancracio
  ui/       bandeja del horno, panadería, simulador, revisión, tutorial y frases
  styles/   estilos
```
