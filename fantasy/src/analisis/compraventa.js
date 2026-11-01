// Buy low / sell high: comprar barato a quien rinde por debajo de su nivel y vender caro
// a quien rinde por encima (o tiene el valor inflado antes de un calendario difícil).

/**
 * datos por jugador: { id, nombre, pos, valor, tendencia, reciente, esperado, proximosCruces, lesion, edad }
 *  - reciente: promedio de puntos de las últimas 3 semanas
 *  - esperado: lo que se espera de él por semana (proyección promedio)
 *  - proximosCruces: factor promedio de las próximas 3 defensas (>1 fácil, <1 difícil)
 */
export function comprarBarato(candidatos, { minValor = 1500 } = {}) {
  return candidatos
    .filter((j) => j.valor >= minValor && !['Out', 'IR', 'PUP', 'Sus'].includes(j.lesion))
    .map((j) => {
      const rend = j.esperado > 0 && j.reciente != null ? j.reciente / j.esperado : 1;
      const razones = [];
      let puntaje = 0;
      if (rend < 0.85) {
        puntaje += (0.85 - rend) * 2;
        razones.push(`rinde ${Math.round((1 - rend) * 100)}% menos de lo esperado`);
      }
      if (j.tendencia < 0) {
        puntaje += Math.min(0.6, -j.tendencia / Math.max(1, j.valor) * 6);
        razones.push('su valor de trade viene bajando');
      }
      if ((j.proximosCruces ?? 1) > 1.05) {
        puntaje += (j.proximosCruces - 1) * 2;
        razones.push('se le viene un calendario fácil');
      }
      return { ...j, rendimiento: rend, puntaje: puntaje * Math.sqrt(j.valor / 3000), razones };
    })
    .filter((j) => j.razones.length >= 1 && j.puntaje > 0.15)
    .sort((a, b) => b.puntaje - a.puntaje);
}

export function venderCaro(mios, { minValor = 800 } = {}) {
  return mios
    .filter((j) => j.valor >= minValor)
    .map((j) => {
      const rend = j.esperado > 0 && j.reciente != null ? j.reciente / j.esperado : 1;
      const razones = [];
      let puntaje = 0;
      if (rend > 1.25) {
        puntaje += (rend - 1.25) * 1.5;
        razones.push(`rinde ${Math.round((rend - 1) * 100)}% por encima de lo esperado`);
      }
      if (j.tendencia > 0) {
        puntaje += Math.min(0.6, j.tendencia / Math.max(1, j.valor) * 6);
        razones.push('su valor está en lo más alto');
      }
      if ((j.proximosCruces ?? 1) < 0.95) {
        puntaje += (1 - j.proximosCruces) * 2;
        razones.push('se le viene un calendario difícil');
      }
      if (j.pos === 'RB' && (j.edad ?? 0) >= 28) {
        puntaje += 0.2;
        razones.push('RB de 28+ años: su valor suele caer rápido');
      }
      if (j.lesion === 'Questionable') {
        puntaje += 0.1;
        razones.push('anda tocado: véndelo antes de que empeore');
      }
      return { ...j, rendimiento: rend, puntaje, razones };
    })
    .filter((j) => j.puntaje > 0.2 && j.razones.length >= 1)
    .sort((a, b) => b.puntaje - a.puntaje);
}
