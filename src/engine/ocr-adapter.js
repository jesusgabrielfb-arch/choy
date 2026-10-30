// Adaptador de Tesseract compartido por el navegador y las pruebas en Node.
// `encode(grayImg)` convierte { gray, width, height } en algo que Tesseract acepta
// (canvas en el navegador, PNG en Node).

function flattenLines(data) {
  const out = [];
  for (const block of data.blocks || []) {
    for (const par of block.paragraphs || []) {
      for (const line of par.lines || []) {
        out.push({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
          words: (line.words || []).map((w) => ({ text: w.text, bbox: w.bbox, confidence: w.confidence })),
        });
      }
    }
  }
  return out;
}

export async function createOcr({ createWorker, PSM, encode, workerOptions = {}, lang = 'spa' }) {
  const worker = await createWorker(lang, 1, workerOptions);
  let mode = null;
  const use = async (psm, whitelist) => {
    const key = psm + '|' + whitelist;
    if (key === mode) return;
    await worker.setParameters({ tessedit_pageseg_mode: psm, tessedit_char_whitelist: whitelist });
    mode = key;
  };
  const run = async (img) => {
    const { data } = await worker.recognize(await encode(img), {}, { blocks: true, text: true });
    return data;
  };
  return {
    async text(img) {
      await use(PSM.AUTO, '');
      return flattenLines(await run(img));
    },
    async digits(img) {
      await use(PSM.SINGLE_BLOCK, '0123456789.X-');
      return flattenLines(await run(img));
    },
    async line(img, whitelist = '') {
      await use(PSM.SINGLE_LINE, whitelist);
      const data = await run(img);
      return { text: (data.text || '').trim(), confidence: data.confidence };
    },
    terminate: () => worker.terminate(),
  };
}
