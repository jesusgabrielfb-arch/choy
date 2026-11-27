set -e
S=/tmp/claude-0/-home-user-choy/7b970df4-2917-5350-8010-80f2fb6a14c9/scratchpad; R=/home/user/choy/estudio/sistema-endocrino
cd $S/endo && python3 gen_anat.py >/dev/null && python3 gen_proc.py >/dev/null && node checkbank.js | tail -1 && python3 build.py
cp sistema-endocrino.html $R/fuente/
cd $R && python3 /home/user/choy/.claude/skills/pagina-de-estudio/scripts/a_vercel.py fuente/sistema-endocrino.html index.html --nombre "Endocrino" --titulo "Sistema Endocrino" --descripcion "Resumen interactivo, dibujos, procesos animados, práctica, simulacro y test del sistema endocrino." --url https://sistema-endocrino-opal.vercel.app --pdf guia-de-estudio.pdf
