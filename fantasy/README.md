# Gusano Fantasy 🐛🏈

Asistente de fantasy football conectado a **Sleeper**, con la mascota en 3D que te aconseja.
Todo en español y con fuentes **gratis**.

## Qué hace

| Pestaña | Qué tiene |
| --- | --- |
| **Carpetas** | Una carpeta por cada liga de Sleeper que tengas |
| **Resumen** | La mascota te dice lo más importante, duelo de la semana con probabilidad, tabla |
| **Equipo** | Alineación recomendada, a quién poner y a quién sentar, **analizador de defensas** (A–F por posición) y defensas libres para rotar |
| **Mercado** | **Armador de trades**: eliges jugador(es) del rival y tuyos y salen opciones justas; **comprar barato / vender caro**; lo que más agregan y sueltan miles de ligas |
| **Waivers** | **Alerta de bye** de esta semana y la siguiente con jugadores libres para cubrir y a quién soltar |
| **Lesiones** | Tus lesionados con consejo, **stash** (lesionados valiosos libres), suplentes que suben, lesionados importantes de la liga |
| **Noticias** | Noticias de la NFL en español (las que vienen en inglés se traducen en el teléfono), filtradas por tus jugadores; analistas que sigas en Bluesky |

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
src/analisis/ puntos, alineación, defensas, trades, compra/venta, byes, lesiones (con pruebas)
src/ui/       pantallas
src/mascota/  la mascota 3D (public/mascota.glb, hecha en ../mascota)
```
