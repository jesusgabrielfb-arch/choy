# Ejemplos de generadores de SVG

Son los scripts reales que dibujaron los esquemas del reproductor. Úsalos como **modelo**:
- copia el que se parezca a lo que necesitas,
- cambia figuras, textos y rutas de entrada y salida (apuntan a carpetas del scratchpad de aquella sesión),
- renderiza una vista previa con `node ../scripts/pruebas/render_svg.cjs archivo.svg salida.png ANCHO ALTO` y mírala antes de meterla en la página.

| Archivo | Qué dibuja | Tipo |
|---|---|---|
| masculino_gen.py (+ masculino_base.svg, masculino_etiquetas.json, vista_etiquetas.py) | Corte lateral del aparato masculino | Dibujo interactivo (makeAnat) |
| ovocito.py | Ovocito II con corona radiada | Dibujo interactivo (makeAnat) |
| proceso_espermatogenesis.py | Tubo seminífero + espermatogonia → 4 espermatozoides | Proceso animado (makeProc) |
| proceso_ovogenesis.py / ovogenesis_flow.py | Ovogonia → cigoto + línea de tiempo | Proceso animado (makeProc) |
| fecundacion_caminos.py | Sí o no hay fecundación (dos caminos) | Figura animada |
| icono.svg + icono_render.cjs | Ícono de la pantalla de inicio | PNG de 512/192/180/32 px |
