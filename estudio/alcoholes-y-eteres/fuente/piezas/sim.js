const SIM={
/* pareo: término → definiciones posibles */
terms:[
 ['Hidroxilo',['Grupo funcional –OH de los alcoholes','Grupo formado por un oxígeno y un hidrógeno']],
 ['Puente de oxígeno',['–O– que une dos radicales en un éter']],
 ['Derivados de hidrocarburos',['Compuestos con C, H y además N, O o S','Se originan al sustituir H por un grupo funcional']],
 ['Alcohol primario',['El –OH está en un carbono unido a un solo carbono','Ejemplo: 1-propanol']],
 ['Alcohol secundario',['El –OH está en un carbono unido a dos carbonos','Ejemplo: 2-propanol']],
 ['Alcohol terciario',['El –OH está en un carbono unido a tres carbonos','Ejemplo: 2-metil-2-propanol']],
 ['Monohidroxilado',['Alcohol con un solo grupo –OH']],
 ['Dihidroxilado',['Alcohol con dos grupos –OH (diol)']],
 ['Trihidroxilado',['Alcohol con tres o más grupos –OH']],
 ['Glicerol',['1,2,3-propanotriol','También se llama glicerina; fórmula C₃H₈O₃']],
 ['Metanol',['Alcohol de madera','Alcohol metílico']],
 ['Etanol',['Espíritu de vino','Alcohol etílico']],
 ['Terbutanol',['Otro nombre del 2-metil-2-propanol']],
 ['Radico funcional',['Sistema que empieza con la palabra alcohol o éter','En alcoholes cambia -ano por -ílico']],
 ['IUPAC',['Sistema en el que los alcoholes terminan en -ol','Sistema en el que el grupo menor del éter termina en -oxi']],
 ['Cadena principal',['La más larga que contiene los carbonos con –OH']],
 ['Isopropil',['Radical –CH(CH₃)₂']],
 ['Isobutil',['Radical –CH₂–CH(CH₃)₂']],
 ['Secbutil',['Radical –CH(CH₃)–CH₂–CH₃']],
 ['Terbutil',['Radical –C(CH₃)₃','Radical que se ordena en la letra b']],
 ['Etil',['Radical –CH₂–CH₃ (C₂H₅)']],
 ['Propil',['Radical –CH₂–CH₂–CH₃ (C₃H₇)']],
 ['Vinil',['Nombre del radical CH₂=CH– en el sistema RF']],
 ['Etenoxi',['Forma -oxi del radical etenil en IUPAC']],
 ['Éter',['Compuesto R–O–R\'','Dos radicales alquílicos separados por un oxígeno']],
 ['Éter simétrico',['Éter con los dos grupos R iguales','Ejemplo: CH₃–O–CH₃']],
 ['Éter asimétrico',['Éter con grupos R distintos','Ejemplo: CH₃–O–C₂H₅']],
 ['-oxi',['Terminación del grupo con menos carbonos del éter']],
 ['-ílico',['Terminación del segundo radical en el nombre RF']],
 ['Hígado graso',['Aumento de lípidos hepáticos por consumo excesivo de etanol']],
 ['Gastritis',['Inflamación del estómago por consumo excesivo de alcohol']],
 ['Mareos',['Efecto a corto plazo del consumo de etanol']]
],
/* respuesta corta: pregunta, elementos esperados [texto, variantes aceptadas…] */
short:[
 ['¿Qué tres átomos (además de C e H) pueden tener los derivados de hidrocarburos?',[['Nitrógeno','nitrogeno'],['Oxígeno','oxigeno'],['Azufre','azufre']]],
 ['Escribe las fórmulas generales del alcohol y del éter.',[['R–OH','r-oh','roh','r–oh'],["R–O–R'",'r-o-r','ror','r–o–r']]],
 ['Nombra los tres tipos de alcohol según el carbono unido al –OH.',[['Primario','primario'],['Secundario','secundario'],['Terciario','terciario']]],
 ['Nombra los tres tipos de alcohol según el número de –OH.',[['Monohidroxilado','mono'],['Dihidroxilado','dihidrox','diol'],['Trihidroxilado','trihidrox','triol']]],
 ['¿Cuáles son los tres nombres que puede tener un alcohol?',[['IUPAC','iupac'],['Radico funcional','radico','funcional','rf'],['Común o vulgar','comun','vulgar']]],
 ['Escribe el nombre IUPAC y el nombre común del glicerol.',[['1,2,3-propanotriol','propanotriol','propantriol'],['Glicerina','glicerina']]],
 ['Escribe el nombre RF y el nombre común del metanol.',[['Alcohol metílico','metilico'],['Alcohol de madera','madera']]],
 ['Escribe el nombre RF y el nombre común del etanol.',[['Alcohol etílico','etilico'],['Espíritu de vino','vino']]],
 ['Menciona dos efectos a corto plazo del etanol.',[['Mareos','mareo'],['Náuseas','nausea']]],
 ['Menciona cuatro efectos a largo plazo del consumo excesivo de etanol.',[['Hígado graso','higado','hepat'],['Gastritis','gastritis'],['Pancreatitis','pancrea','cetoacidosis'],['Cáncer / desnutrición / memoria','cancer','desnutri','memoria','psicolog','reproduc','triglic']]],
 ['¿Cuáles son los dos tipos de éteres según sus grupos R?',[['Simétricos','simetric'],['Asimétricos','asimetric']]],
 ['¿En qué terminan el grupo menor (IUPAC) y el segundo radical (RF) de un éter?',[['-oxi','oxi'],['-ílico','ilico']]],
 ['Escribe el nombre IUPAC y el RF de CH₃–O–CH₃.',[['Metoxi-metano','metoximetano','metoxi metano'],['Éter dimetílico','dimetilico','metil-metilico','metilmetilico']]],
 ['Escribe el nombre IUPAC y el RF de CH₃–O–C₂H₅.',[['Metoxi-etano','metoxietano','metoxi etano'],['Éter etil-metílico','etil-metilico','etilmetilico','etil metilico']]],
 ['¿Qué terminaciones lleva el grupo mayor de un éter según su enlace?',[['-ano (simple)','ano'],['-eno (doble)','eno'],['-ino (triple)','ino']]],
 ['Escribe los radicales que corresponden a –CH(CH₃)₂ y –C(CH₃)₃.',[['Isopropil','isopropil'],['Terbutil','terbutil','tert','terc']]],
 ['¿Qué palabra inicia el nombre RF de un alcohol y cuál el de un éter?',[['Alcohol','alcohol'],['Éter','eter']]],
 ['Escribe el nombre IUPAC del terbutanol y di qué tipo de alcohol es.',[['2-metil-2-propanol','2-metil-2-propanol','metilpropan','metil-2-propanol'],['Terciario','terciario']]]
],
/* casos */
cases:[
 {id:'lab',make:()=>({title:'Las botellas del laboratorio',text:'En el laboratorio del colegio hay tres botellas sin etiqueta. Sus fórmulas son: <b>A)</b> CH₃–OH, <b>B)</b> CH₃–CH(OH)–CH₃ y <b>C)</b> CH₃–O–CH₃.',
   qs:[{q:'¿Cuál de las tres botellas es un éter y cómo se llama en IUPAC?',type:'open',model:'La C: CH₃–O–CH₃ es un éter simétrico llamado metoxi-metano (éter dimetílico).',k:['eter','metoxi|dimetil'],pts:2},
       {q:'¿Cómo se llama la botella A en IUPAC?',type:'text',ans:['metanol'],show:'Metanol (alcohol metílico, alcohol de madera)'},
       {q:'¿Qué nombre radico funcional tiene la botella B y qué tipo de alcohol es?',type:'open',model:'Alcohol isopropílico (2-propanol); es un alcohol secundario porque el –OH está en un carbono unido a dos carbonos.',k:['isopropil','secundario'],pts:2}]})},
 {id:'fiesta',make:()=>({title:'Después de la fiesta',text:'Carlos, de 19 años, bebió mucho en una fiesta. Esa noche tuvo mareos y náuseas. Su papá le cuenta que su tío, que bebió en exceso por años, tiene el hígado dañado y problemas de memoria.',
   qs:[{q:'¿Qué compuesto orgánico tienen las bebidas alcohólicas?',type:'text',ans:['etanol','alcohol etilico','etilico'],show:'Etanol (alcohol etílico)'},
       {q:'¿Los síntomas de Carlos son efectos a corto o a largo plazo?',type:'text',ans:['corto'],show:'A corto plazo'},
       {q:'Menciona tres efectos a largo plazo que podría tener el tío además de los de la memoria.',type:'open',model:'Hígado graso, hepatitis alcohólica, gastritis, pancreatitis, cetoacidosis, aumento de triglicéridos, cáncer, desnutrición, daños al sistema reproductor y perturbaciones psicológicas.',k:['higado|hepatitis','gastritis|pancrea|cetoacid|triglic','cancer|desnutri|reproduc|psicolog'],pts:3}]})},
 {id:'corrige',make:()=>({title:'El examen de Sofía',text:'Sofía escribió en su examen estos nombres: <b>1)</b> 1-pentin-3,4-diol, <b>2)</b> secbutoxi-isopropano y <b>3)</b> éter vinil-isobutílico.',
   qs:[{q:'Corrige el nombre 1.',type:'text',ans:['4-pentin-2,3-diol','4pentin23diol','pent-4-ino-2,3-diol'],show:'4-pentin-2,3-diol'},
       {q:'Corrige el nombre 2.',type:'text',ans:['isopropoxi-secbutano','isopropoxisecbutano','2-isopropoxibutano'],show:'Isopropoxi-secbutano'},
       {q:'Corrige el nombre 3 y explica cuál fue el error.',type:'open',model:'Éter isobutil-vinílico: en el nombre RF los radicales van en orden alfabético e isobutil (i) va antes que vinil (v).',k:['isobutil-vinilico|isobutil vinilico|isobutilvinilico','alfabet'],pts:2}]})},
 {id:'cadena',make:()=>({title:'La cadena escondida',text:'Pedro nombró este compuesto como <b>2,3-dietil-3-metil-4-hexen-2,6-diol</b>, pero la profe se lo marcó mal.',
   qs:[{q:'¿Cuántos carbonos tiene en realidad la cadena principal?',type:'text',ans:['7','siete'],show:'7 (hepteno)'},
       {q:'¿Cuál es el nombre correcto?',type:'text',ans:['4-etil-4,5-dimetil-2-hepten-1,5-diol','4etil45dimetil2hepten15diol','4-etil-4,5-dimetilhept-2-eno-1,5-diol'],show:'4-etil-4,5-dimetil-2-hepten-1,5-diol'},
       {q:'Explica por qué cambió la cadena.',type:'open',model:'Porque el etil del C2 alarga la cadena: incluyéndolo hay 7 carbonos que contienen los dos –OH, y se numera desde el CH₂OH.',k:['etil','larga|alarga','oh|hidroxilo'],pts:2}]})},
 {id:'cosmetico',make:()=>({title:'La crema de mamá',text:'La mamá de Ana usa una crema que dice en la etiqueta: <b>glicerina</b>. Ana quiere saber qué es químicamente.',
   qs:[{q:'¿Cuál es el nombre IUPAC de la glicerina?',type:'text',ans:['1,2,3-propanotriol','propanotriol','123propanotriol'],show:'1,2,3-propanotriol'},
       {q:'Según el número de –OH, ¿qué tipo de alcohol es?',type:'text',ans:['trihidroxilado','triol'],show:'Trihidroxilado'},
       {q:'Escribe su fórmula semidesarrollada y su fórmula molecular.',type:'open',model:'CH₂OH–CHOH–CH₂OH; fórmula molecular C₃H₈O₃.',k:['ch2oh|choh','c3h8o3'],pts:2}]})}
],
/* comparación */
compare:[
 {q:'Compara alcoholes y éteres: fórmula general, grupo funcional y terminación IUPAC.',model:'Alcohol: R–OH, grupo hidroxilo, termina en -ol. Éter: R–O–R\', puente de oxígeno, el grupo menor termina en -oxi y el mayor en -ano, -eno o -ino.',k:['r-oh|roh|r–oh','hidroxilo','-ol|termina en ol','r-o-r|ror|puente','oxi'],pts:4},
 {q:'Compara un alcohol primario, uno secundario y uno terciario con un ejemplo de cada uno.',model:'Primario: el –OH en un C unido a un carbono (1-propanol). Secundario: en un C unido a dos carbonos (2-propanol). Terciario: en un C unido a tres carbonos (2-metil-2-propanol).',k:['primario','secundario','terciario','propanol'],pts:4},
 {q:'Compara el nombre IUPAC y el nombre radico funcional de los alcoholes con un ejemplo.',model:'IUPAC: cadena más larga con el –OH, se cambia -ano por -ol y se numera (2-propanol). RF: se escribe "alcohol" y se cambia -ano por -ílico (alcohol isopropílico).',k:['-ol|termina en ol','alcohol','ilico','propanol|etanol|metanol'],pts:4},
 {q:'Compara los éteres simétricos y asimétricos y nombra un ejemplo de cada uno en IUPAC y RF.',model:'Simétrico: dos R iguales, CH₃–O–CH₃ = metoxi-metano / éter dimetílico. Asimétrico: R distintos, CH₃–O–C₂H₅ = metoxi-etano / éter etil-metílico.',k:['igual','distint|diferent','metoxi','eter'],pts:4},
 {q:'Compara los efectos a corto y a largo plazo del consumo de etanol.',model:'Corto plazo: mareos y náuseas. Largo plazo (consumo excesivo): problemas de memoria, hígado graso, más triglicéridos, gastritis, pancreatitis, hepatitis alcohólica, cáncer, desnutrición, daños al sistema reproductor y perturbaciones psicológicas.',k:['mareo|nausea','higado|hepatitis','gastritis|pancrea','memoria|cancer|desnutri'],pts:4}
],
/* nivel alto */
high:[
 {q:'El nombre "5-butil-2,3-dietil-6-metil-4-hepten-3,4-diol" está mal. Dibuja la estructura, explica todos los errores y escribe el nombre correcto.',model:'Al dibujarlo se ve que la cadena no es la más larga: el etil del C2 y el butil del C5 la alargan a 10 C (deceno) y la cadena sigue conteniendo los dos –OH. Se numera desde el lado del etil: –OH en 4 y 5, doble enlace en 5. Quedan metil en C3, etil en C4 e isopropil en C6. Nombre: 4-etil-6-isopropil-3-metil-5-decen-4,5-diol.',k:['larga|alarga','10|diez|decen','4,5|45','isopropil','decen-4,5-diol|decen'],pts:5},
 {q:'Explica paso a paso cómo se nombra CH(CH₃)₂–C(C₃H₇)OH–CH₂–CH(C₂H₅)–CH[CH₂OH]–CH(CH₃)₂ y por qué la cadena principal no es la que parece a simple vista.',model:'Se desarrollan los grupos. Hay dos –OH (en el C del propil y en el CH₂OH). La cadena más larga que contiene a los dos va del CH₂OH, pasa por el centro y sigue por el propil: 8 C (octano). Se numera desde el CH₂OH (–OH en 1 y 5). Radicales: isopropil en C2 y C5, etil en C3. Nombre: 3-etil-2,5-diisopropil-1,5-octanodiol.',k:['propil','8|ocho|octan','1,5|15','isopropil','etil'],pts:5}
]
};
/* partes para las imágenes (salen de los dibujos interactivos) */
const SIM_IMG={
 tipos:{title:'Tipos de carbono y de alcohol',src:'#anat-tipos svg',pick:4,keys:{oh1:['primario'],oh2:['secundario'],oh3:['terciario'],cprim:['primario'],csec:['secundario'],cter:['terciario'],metil:['metil'],c4:['carbono 4','c4','ch3']},
   explain:{q:'Escribe el nombre IUPAC del compuesto y explica por qué es trihidroxilado.',model:'3-metil-1,2,3-butanotriol. Es trihidroxilado porque tiene tres grupos –OH (uno primario, uno secundario y uno terciario).',k:['butanotriol','tres|3','primario|secundario|terciario'],pts:2}},
 alc:{title:'Alcohol 4-etil-4-metil-5-hepten-2-ol',src:'#anat-alc svg',pick:5,keys:{c1:['carbono 1','c1','1'],hidroxilo:['hidroxilo','oh'],c2:['carbono 2','c2','secundario'],cadena:['cadena'],c4:['carbono 4','c4'],metil:['metil'],etil:['etil'],doble:['doble']},
   explain:{q:'Explica por qué la numeración empieza en el extremo marcado como carbono 1 y no en el otro.',model:'Porque se numera desde el extremo más cercano al –OH: así el –OH queda en el C2; desde el otro lado quedaría en el C6.',k:['cercan','oh|hidroxilo','2|dos'],pts:2}},
 eter:{title:'Éter metoxi-4-metil-pentano',src:'#anat-eter svg',pick:4,keys:{menor:['menor','metoxi','metil'],puente:['puente','oxigeno'],c1:['c1','carbono 1'],mayor:['mayor','pentano'],c4:['carbono 4','c4'],metil:['metil']},
   explain:{q:'Escribe el nombre IUPAC del éter y explica por qué el grupo de la izquierda lleva -oxi.',model:'Metoxi-4-metil-pentano: el grupo de la izquierda tiene un solo carbono (el menor), por eso se nombra con -oxi (metoxi).',k:['metoxi','menor|menos','pentano'],pts:2}}
};
