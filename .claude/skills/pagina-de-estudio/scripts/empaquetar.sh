#!/usr/bin/env bash
# Empaqueta la skill como .zip autónomo (para subirla a claude.ai o usarla en otro proyecto).
# Incluye la página de referencia, la guía, las mascotas y los íconos del Sistema Reproductor.
# Uso: bash empaquetar.sh <ruta-del-repo-choy> <salida.zip>
set -e
REPO=$(cd "$1" && pwd); OUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2")
TMP=$(mktemp -d); D=$TMP/pagina-de-estudio
cp -r "$REPO/.claude/skills/pagina-de-estudio" "$D"
mkdir -p "$D/referencia_pagina"
cp "$REPO/estudio/sistema-reproductor/fuente/sistema-reproductor.html" "$REPO/estudio/sistema-reproductor/fuente/guia.html" "$D/referencia_pagina/"
cp -r "$REPO/estudio/sistema-reproductor/fuente/fonts" "$REPO/estudio/sistema-reproductor/mascotas" "$REPO/estudio/sistema-reproductor/iconos" "$D/referencia_pagina/"
cp -r "$REPO/estudio/sistema-reproductor/blender" "$D/referencia_pagina/blender"
cp "$REPO/estudio/sistema-reproductor/vercel.json" "$REPO/estudio/sistema-reproductor/manifest.webmanifest" "$D/referencia_pagina/"
rm -f "$OUT"; (cd "$TMP" && zip -qr "$OUT" pagina-de-estudio)
rm -rf "$TMP"; echo "listo: $OUT ($(du -h "$OUT" | cut -f1))"
