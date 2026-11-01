# CLAUDE.md — Cómo trabajar conmigo

Este archivo lo lee Claude al empezar cada sesión. Aquí van mis preferencias, mis ideas y mis
proyectos para no tener que repetirlos.

## Comunicación

- Háblame siempre en **español**, claro y directo, sin palabras técnicas innecesarias.
- Cuando te diga **"no codifiques"**, solo explica si se puede y cómo se haría. No toques código.
- Antes de un proyecto grande: primero **entender la idea** → lluvia de ideas → especificación →
  plan → ejecución. Pregunta lo que no esté claro antes de programar.
- Dime con honestidad si algo no se puede hacer o tiene límites (precios, reglas, permisos).
- **Siempre usar las alternativas gratis.** Si algo solo existe de pago, avísame antes y
  propón la opción gratis más cercana.

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

### App de fantasy football tipo Sleeper — "Gusano Fantasy" (carpeta `fantasy/`)

Primera versión hecha (ver `fantasy/README.md`): carpetas por liga, titulares, analizador de
defensas, trades justos, buy low / sell high, alertas de bye, lesiones y stash, noticias en
español y analistas de Bluesky. Consejos con reglas (gratis), sin IA de pago. La app pide el
usuario de Sleeper (no está guardado aquí).

Ideas originales:

- Estructura parecida a Sleeper (inspirada, no copiada): ligas, mi equipo, duelo de la semana,
  jugadores/waivers, cambios, draft y chat.
- Conectada a **mi liga de Sleeper** con su API pública (solo lectura: la IA aconseja, yo hago
  los movimientos en Sleeper).
- Una **mascota propia** que es la que me aconseja: un **gusano gordito verde-amarillo** con
  antenas de punta azul, ojos de párpado caído (cara de "me las sé todas") y camiseta de fútbol
  americano (por defecto negra con azul, número 1). Expresiones: feliz, aburrido, sorprendido,
  enojado y cool con lentes. Primera versión 3D en `mascota/` (`mascota.glb` con 9 animaciones).
- **Noticias de la NFL** al día cruzadas con mis jugadores para avisarme.

Herramientas gratis elegidas:

| Parte | Opción gratis |
| --- | --- |
| Datos de la liga | API pública de Sleeper (sin clave) |
| Noticias | RSS (ESPN, NFL.com, NBC Sports Edge, CBS, Yahoo), API de Bluesky, lesionados y tendencias de Sleeper |
| X/Twitter | **No** usar la API de pago ni copiar datos de X; seguir a esos periodistas en Bluesky/RSS |
| Mascota 3D | Blender + complemento `blender-mcp` (gratis), Rigify o Mixamo, planes gratis de imagen a 3D |
| Hosting | Vercel plan Hobby |
| Revisar noticias seguido | GitHub Actions programado (el cron gratis de Vercel solo corre 1 vez al día) o buscar noticias al abrir la app |
| Base de datos | Supabase plan gratis |
| IA de la mascota | La API de Claude cobra por uso: buscar la opción más barata o gratis y avisar antes de gastar |

## Mi equipo y herramientas

- Computadora **Windows** (`jesus-laptop`), Blender **5.2** instalado.
- **Blender ya está conectado** a la app de escritorio de Claude con el complemento
  *MCP for Blender* (antes `blender-mcp`, repo `ahujasid/mcp-for-blender`), servidor en el puerto 9876.
  - Config en `claude_desktop_config.json` → `C:\Users\jesus\.local\bin\uvx.exe blender-mcp`.
  - Para usarlo: abrir Blender, panel **N → MCP for Blender** (Start MCP Server) y escribir en un
    chat del modo **Chat** de la app de escritorio. Las sesiones de Code en la **nube** no ven mi Blender.
  - Opciones gratis activadas: Poly Haven. Rigify para el esqueleto de la mascota.

## Ideas y pendientes

<!-- Agregar aquí las ideas nuevas para animar cosas, frases de las mascotas, etc. -->
