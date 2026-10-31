# CLAUDE.md — Cómo trabajar conmigo

Este archivo lo lee Claude al empezar cada sesión. Aquí van mis preferencias, mis ideas y mis
proyectos para no tener que repetirlos.

## Comunicación

- Háblame siempre en **español**, claro y directo, sin palabras técnicas innecesarias.
- Cuando te diga **"no codifiques"**, solo explica si se puede y cómo se haría. No toques código.
- Antes de un proyecto grande: primero **entender la idea** → lluvia de ideas → especificación →
  plan → ejecución. Pregunta lo que no esté claro antes de programar.
- Dime con honestidad si algo no se puede hacer o tiene límites (precios, reglas, permisos).

## Estilo y diseño

- Nada de estética genérica de IA. Diseño cuidado, moderno y con personalidad.
- Me gustan las **mascotas con personalidad** que acompañan y aconsejan (ej. Pancracio, el pan
  que se tuesta según las notas).
- Me gusta el **3D y las animaciones** (Three.js, modelos `.glb`, animaciones de Blender).
- Humor y frases propias, en español, con carácter.
- Todo tiene que verse bien en el **celular**.

## Forma de trabajar en código

- Stack habitual: **Vite + JavaScript**, **Three.js** para 3D, funciones en **Vercel**,
  **Supabase** cuando se necesite base de datos.
- Arquitectura limpia y ordenada desde el principio (carpetas por responsabilidad).
- Pruebas automáticas para la lógica importante (`npm test`).
- **Privacidad**: los datos personales (capturas, claves) no se suben al repositorio. Las claves
  van en variables de entorno de Vercel.
- Mensajes de commit en español, describiendo el cambio.

## Proyectos

### Calculadora de notas SEDUCA — "En la puerta del horno se quema el pan" (este repo)

Lee capturas del portal SEDUCA, calcula promedios igual que el portal, simula notas y tiene a
Pancracio en una cocina 3D. Detalles en `README.md`.

### Idea: app de fantasy football tipo Sleeper con IA (por empezar)

- Estructura parecida a Sleeper (inspirada, no copiada): ligas, mi equipo, duelo de la semana,
  jugadores/waivers, cambios, draft y chat.
- Conectada a **mi liga de Sleeper** con su API pública (solo lectura: la IA aconseja, yo hago
  los movimientos en Sleeper).
- Una **mascota propia** (ya tengo la imagen) que es la que me aconseja, animada en **Blender**
  y exportada a `.glb` para la app.
- **Noticias de la NFL** al día (periodistas de X/Twitter, RSS, Bluesky, lesionados) cruzadas
  con mis jugadores para avisarme.

## Ideas y pendientes

<!-- Agregar aquí las ideas nuevas para animar cosas, frases de las mascotas, etc. -->
