import re, sys, os
D = os.path.dirname(os.path.abspath(__file__))
REF = '/home/user/choy/estudio/sistema-reproductor/fuente/sistema-reproductor.html'
PL = '/home/user/choy/.claude/skills/pagina-de-estudio/plantilla/'
s = open(REF).read()
rd = lambda n: open(os.path.join(D, n)).read()

def cut(a, b, new, keep_b=True):
    global s
    assert s.count(a) == 1, ('A', a[:60], s.count(a))
    i = s.index(a); j = s.index(b, i)
    s = s[:i] + new + (s[j:] if keep_b else s[j + len(b):])

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:80], s.count(a))
    s = s.replace(a, b)

# --- datos de ejercicios desde la versión anterior ---
src = rd('src.html')
def grab(name):
    i = src.index('const ' + name + '=[')
    j = src.index('\n];', i)
    return src[i:j + 3]
EJ = '\n'.join(grab(n) for n in ('EJ_GUIA', 'EJ_I', 'EJ_II'))
EJ = EJ.replace('Cadena de 6 C. Desde', 'Cadena de 6 C. Desde')
EJ += """
const EJ_ETER=[['Guía','Nombra el éter:','CH₃–CH(CH₃)–CH₂–CH₂–CH₂–O–CH₃',C('CH3|O|CH2|CH2|CH2|CH{u:CH3}|CH3'),[2,6],'Metoxi-4-metil-pentano','Nombre formal: 1-metoxi-4-metilpentano.','Grupo menor: metil → <b>metoxi</b>. El otro lado es una cadena de 5 C (<b>pentano</b>) con un metil; se numera desde el carbono pegado al oxígeno, así que el metil queda en el C4.',['metoxi-4-metil-pentano','metoxi-4-metilpentano','1-metoxi-4-metilpentano']]];
const MOLS={ex_prim:[C('CH3|CH2|CH2{u:OH}')],ex_sec:[C('CH3|CH{u:OH}|CH3')],ex_ter:[C('CH3|C{u:OH;d:CH3}|CH3')],glicerol:[C('CH2{u:OH}|CH{u:OH}|CH2{u:OH}')],ex_sim:[C('CH3|O|CH3')],ex_asim:[C('CH3|O|CH2|CH3')]};
"""

# --- head ---
rep('<title>Sistema Reproductor</title>', '<title>Alcoholes y Éteres</title>')
i = s.index('</style>')
s = s[:i] + open(PL + 'temas-visuales.css').read() + '\n' + rd('extra.css') + s[i:]

# --- cuerpo (nav, portada, temas) ---
cut('<canvas id="confetti"', '<!-- PRACTICA -->', rd('body.html'))
# textos de práctica/simulacro/test
s = re.sub(r'Hay más de 520 preguntas basadas en tus apuntes y en el PPT de clase', 'Hay más de 300 preguntas basadas en la guía N.° 2 y en la práctica de derivados', s)
s = s.replace('Test: Sistema Reproductor', 'Test: Alcoholes y Éteres').replace('Biología · Prof. Yaisel', 'Química · Prof. Yanin Navarro Lee')
s = s.replace('sistema-reproductor.vercel.app', 'alcoholes-y-eteres.vercel.app')
s = re.sub(r'<select id="dp-topic">.*?</select>', '<select id="dp-topic"><option value="all">Todos los temas</option>' + ''.join(f'<option value="{k}">{v}</option>' for k, v in [('deriv','Derivados'),('clasif','Clasificación'),('nomalc','Nomenclatura de alcoholes'),('etanol','Etanol'),('eter','Éteres'),('ejer','Ejercicios de la práctica')]) + '</select>', s, flags=re.S)
s = re.sub(r'<footer>.*?</footer>', '<footer><span class="hand">¡tú puedes sacar 5! ⌬</span><br>Guía hecha con la Guía N.° 2 y la práctica de derivados de la profe Yanin Navarro Lee. Lo que agregué está marcado como "Extra".</footer>', s, flags=re.S)

# --- JS ---
rep('const RM=matchMedia', "document.body.classList.add('paleta-molecula');\nconst RM=matchMedia")
cut('/* ---------- hero: espermatozoides', '/* ---------- reveal', rd('hero.js'))
cut('/* ---------- mascotas: Spermi y Ovulina ---------- */', 'const pick=', rd('masc.js') + '\n' + EJ + '\n')
cut('const TAP={', "document.querySelectorAll('.stage .mascot')", rd('tap.js'))
rep("const SECS=['base','masculino','espermatogenesis','femenino','ovogenesis','ciclo','calculo','fecundacion','its','metodos','confusiones'];", "const SECS=['derivados','alcoholes','nomenclatura','etanol','eteres','modelos','confusiones'];")
s = s.replace("n<5?'¡Buen comienzo! Sigue así.':n<9?", "n<3?'¡Buen comienzo! Sigue así.':n<6?")
cut("makeAnat('anat-fem'", '/* ---------- procesos animados interactivos ---------- */', rd('regionA.js'))
cut("makeProc('anat-esp'", '/* ---------- banco de preguntas por tema ---------- */', rd('regionB.js'))
cut('/* ---------- banco de preguntas por tema ---------- */', '/* ---------- configuración: temas y forma de estudiar ---------- */', rd('bank.js') + '\n')
# SUBT
SUBT = '''const SUBT={"deriv":[["formula","r-oh|r–oh|r-o-r|r–o–r|formula general|\\\\br\\\\b"],["grupo","grupo funcional|hidroxilo|puente"],["origen","sustitu|reemplaz|hidrogeno|nitrogeno|azufre|origina"],["familias","alcohol|eter|hidrocarburo|oxigenad"]],
"clasif":[["tipocarbono","primario|secundario|terciario|terbutanol|carbono"],["numoh","mono|dihidrox|trihidrox|diol|triol|glicer|grupos -oh|grupos –oh"],["dibujo","marcad"]],
"nomalc":[["radicales","radical|metil|etil|propil|butil|isopropil|terbutil|isobutil|secbutil"],["rf","radico|ilico|alcohol de|espiritu|comun"],["reglas","cadena|enumer|numer|extremo|alfabet|desempat|paso"],["nombres","nombre iupac|se llama|nombre de"]],
"etanol":[["corto","corto|mareo|nausea|inmediat"],["largo","largo|higado|gastritis|pancrea|hepatitis|cancer|desnutri|trigli|memoria|psicolog|reproduc"],["uso","util|bebida|etilico"]],
"eter":[["tipos","simetric|asimetric"],["iupac","oxi|iupac"],["rf","radico|rf|ilico|vinil|alfabet"],["def","puente|radicales|r-o-r|r–o–r"]],
"ejer":[["parte1","53[1-9]"],["parte2","56[4-9]|57[0-4]"],["guia","guia"],["reglas","cadena|numer|alfabet|corrige|error"]]};'''
i = s.index('const SUBT='); j = s.index('\n', i)
s = s[:i] + SUBT + s[j:]
# fillOk más estricto con números y sin signos
rep("function fillOk(v,alts){", "function fillOk(v,alts){const z=t=>norm(t).replace(/[\\s.,;:!?¡¿\"'()\\-–—]/g,''),dg=t=>(norm(t).match(/\\d+/g)||[]).join('|');{const zv=z(v);if(!zv)return false;if(alts.some(a=>z(a)===zv))return true;if(alts.some(a=>/\\d/.test(a))&&!alts.some(a=>dg(a)===dg(v)))return false}")
# simulacro
cut('const SIM={', '/* partes para las imágenes */', rd('sim.js').split('/* partes para las imágenes')[0])
i = s.index('const SIM_IMG={'); j = s.index('\n};', i)
simimg = rd('sim.js').split('/* partes para las imágenes (salen de los dibujos interactivos) */')[1]
simimg += "\nObject.keys(SIM_IMG).forEach(k=>{const d=SIM_IMG[k];d.parts=Object.entries(d.keys).filter(([p])=>ANCH[k]&&ANCH[k][p]).map(([p,acc])=>[ANAT_NAMES[k][p],ANCH[k][p][0],ANCH[k][p][1],acc])});\n"
s = s[:i] + simimg + s[j + 3:]
i = s.index('const LBL={'); j = s.index('\n', s.index("sperm:{'Acrosoma'", i))
s = s[:i] + 'const LBL=ANAT_LBL;' + s[j:]
rep("shufR(['fem','masc','ovocito','sperm','chart','male','ovo'],r)", "shufR(['tipos','alc','eter'],r)")
rep("if(im.k==='fem'||im.k==='sperm'||im.k==='masc'||im.k==='ovocito'){", "if(SIM_IMG[im.k]&&SIM_IMG[im.k].src){")
# daypo
rep("const C={ink:'#45403F',mut:'#8A8381',coral:'#E07A5F',pink:'#E58BA0',rose:'#F6C3D3',sage:'#5E958A',yel:'#E0A146',blue:'#6A9FD0',lil:'#A58BDB',red:'#D0665E',cream:'#FFE9DF'};","const C={ink:'#3A3940',mut:'#7C7F88',coral:'#D8473E',pink:'#F25C9F',rose:'#FCDDEE',sage:'#2A8FB8',yel:'#2A8FB8',blue:'#2A8FB8',lil:'#C2477F',red:'#D8473E',cream:'#FFE4F0'};")
cut('const S={', '/* ---------- datos y estado ---------- */', rd('daypo.js') + '\n')
# picHTML anclas
rep("({masc:MASC_P,ovocito:OVO_P,esp:ESP_P,ovp:OVP_P}[sp.img]||{})[sp.p]", "(ANCH[sp.img]||{})[sp.p]")
# cuenta de preguntas en la portada
rep("renderChips();renderModes();summary();", "renderChips();renderModes();summary();{const e=document.getElementById('st-q');if(e)e.textContent=BANK.length}")

# --- renombres globales ---
for a, b in [('spermi', 'hidroxi'), ('ovulina', 'eterea'), ('Spermi', 'Hidroxi'), ('Ovulina', 'Etérea'), ('Yaisel', 'Yanin'), ("'repro-", "'alc-"), ('"repro-', '"alc-'), ('`repro-', '`alc-')]:
    s = s.replace(a, b)

# --- buscador y cuadros ya están en la referencia ---
open(os.path.join(D, 'alcoholes-y-eteres.html'), 'w').write(s)
print('ok', len(s))
