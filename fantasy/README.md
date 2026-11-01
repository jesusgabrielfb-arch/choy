# Fantasy x Cody 🐛🏈

Asistente de fantasy football conectado a **Sleeper**, con la mascota en 3D que te aconseja.
Todo en español y con fuentes **gratis**.

## Qué hace

Al entrar pide tu usuario de Sleeper y **tu equipo favorito de la NFL**: Cody se pone su camiseta
y toda la app toma sus colores. Cody aparece en cada pantalla y te habla.

| Pestaña | Qué tiene |
| --- | --- |
| **Ligas** | Una carpeta por cada liga de Sleeper que tengas |
| **Cody** (inicio) | **Casilla del enfrentamiento** (como Sleeper: tus titulares vs los del rival, puesto por puesto, con puntos, proyección y bancas), **plan de la semana** (acciones concretas con los puntos que ganas: "sienta a X y pon a Y", "agrega a Z de waivers y suelta a W", byes de la semana que viene), **tu punto débil** con un trade justo para arreglarlo, tabla |
| **Equipo** | Alineación recomendada con "Entra"/"Sale", lesionados con consejo, analizador de defensas (A–F) y **mejores defensas (DST) de la semana** y la siguiente según la ofensiva rival, marcando si es tuya, libre o de otro equipo |
| **Mercado** | Armador de trades justos (Cody opina si te roban), comprar barato / vender caro, lo que hacen miles de ligas |
| **Jugadores** | Qué agregar esta semana, byes, mejores libres por posición, tendencias, stash, suplentes que suben, lesionados de la liga |
| **NFL** | **Calendario** de cada semana con horas, marcadores en vivo y TV; los **32 equipos** con su plantilla dividida por posición |
| **Noticias** | En español (las de inglés se traducen en el teléfono), primero las de tus jugadores; analistas de Bluesky |

**📊 Ficha de jugador**: toca a cualquier jugador en la app y sale su **registro de juego** (snaps, acarreos, yardas por acarreo, recepciones, TD, puntos por partido) y sus **próximos partidos** con día, hora y proyección (`api/jugador.js`).

**⏰ Horarios y cerebro**: cada jugador muestra cuándo juega; Cody avisa de los que juegan antes del domingo, no sugiere mover a quien ya jugó y, cuando ya pasaron los waivers de la semana, piensa en la siguiente. Los que todavía no juegan cuentan con su proyección (no con 0) para el % de ganar. **↻** trae todo fresco.

**🎓 Tutorial con Cody**: la primera vez que entras a una liga, Cody te explica cada parte resaltándola (se puede saltar; se vuelve a ver desde el buscador).

**🔍 Buscador** (arriba): encuentra cualquier función o jugador (con su ficha: dueño, valor, proyección, rival y botón para armar un trade).

**Arriba de cada liga** puedes cambiar de semana (◀ ▶): las pasadas muestran resultados y las
futuras sus proyecciones. Cada duelo tiene su **porcentaje de victoria**, en vivo durante los partidos.

**🔔 Notificaciones** (Web Push, gratis): titulares lesionados o de bye, puestos vacíos, byes de
la semana que viene y noticias de tus jugadores. Se activan en la pantalla de tus ligas. En iPhone,
primero hay que agregar la app a la pantalla de inicio. Las revisa `api/avisar.js`, llamado por
una tarea diaria de Vercel y cada 30 min por GitHub Actions (`.github/workflows/avisos-fantasy.yml`,
solo corre desde la rama principal). Las suscripciones y las llaves se guardan en Vercel Blob privado.

## Fuentes (todas gratis)

- **Sleeper** (API pública, solo lectura): usuario, ligas, rosters, duelos, jugadores, lesiones,
  tendencias, proyecciones y estadísticas.
- **FantasyCalc**: valores de trade sacados de miles de trades reales.
- **ESPN** (API pública): calendario, rivales y byes.
- **RSS**: ESPN Deportes, ESPN, CBS Sports, RotoWire, Yahoo (`api/noticias.js`).
- **Bluesky**: analistas que elijas (API pública).
- Traducción: el traductor que trae el navegador (Chrome). Si no hay, el enlace abre la nota traducida.

Sleeper no deja que otras apps hagan cambios: la app aconseja y tú haces el movimiento en Sleeper.
X/Twitter no se usa porque su API es de pago.

## Usarla

```bash
cd fantasy
npm install
npm run dev      # http://localhost:5173 (las funciones /api también corren en local)
npm test         # pruebas de los cálculos
npm run build
```

### Publicar en Vercel (gratis)

Nuevo proyecto en Vercel → importar este repositorio → **Root Directory: `fantasy`**.
Detecta Vite solo. No necesita claves.

## Estructura

```
api/          funciones de Vercel: proxy (fuentes sin CORS) y noticias (RSS)
src/datos/    Sleeper, FantasyCalc, ESPN, noticias, caché
src/analisis/ puntos, alineación, defensas, trades, compra/venta, byes, lesiones y plan de la semana (con pruebas)
src/datos/equipos.js  colores de los 32 equipos para el tema y la camiseta de Cody
src/ui/       pantallas
src/mascota/  la mascota 3D (public/mascota.glb, hecha en ../mascota)
```
