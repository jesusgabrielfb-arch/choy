# Gusano Fantasy 🐛🏈

Asistente de fantasy football conectado a **Sleeper**, con la mascota en 3D que te aconseja.
Todo en español y con fuentes **gratis**.

## Qué hace

Al entrar pide tu usuario de Sleeper y **tu equipo favorito de la NFL**: Cody se pone su camiseta
y toda la app toma sus colores. Cody aparece en cada pantalla y te habla.

| Pestaña | Qué tiene |
| --- | --- |
| **Ligas** | Una carpeta por cada liga de Sleeper que tengas |
| **Inicio** | Duelo de la semana con probabilidad, **plan de la semana** (acciones concretas con los puntos que ganas: "sienta a X y pon a Y", "agrega a Z de waivers y suelta a W", byes de la semana que viene), **tu punto débil** con un trade justo para arreglarlo, tabla |
| **Equipo** | Alineación recomendada con "Entra"/"Sale", lesionados con consejo, analizador de defensas (A–F) y defensas libres para rotar |
| **Mercado** | Armador de trades justos (Cody opina si te roban), comprar barato / vender caro, lo que hacen miles de ligas |
| **Jugadores** | Qué agregar esta semana, byes, mejores libres por posición, tendencias, stash, suplentes que suben, lesionados de la liga |
| **Noticias** | En español (las de inglés se traducen en el teléfono), primero las de tus jugadores; analistas de Bluesky |

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
