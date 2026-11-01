import { defineConfig } from 'vite';

// En desarrollo, sirve las funciones de /api igual que Vercel.
function funcionesApi() {
  return {
    name: 'funciones-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/([a-z]+)(\?.*)?$/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [funcionesApi()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  server: { host: true },
});
