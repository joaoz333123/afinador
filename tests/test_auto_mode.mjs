// src/constants/tunings.ts
function calculateFrequency(semitonesFromA4, a4 = 440) {
  return a4 * Math.pow(2, semitonesFromA4 / 12);
}
function calculateCents(detectedFreq, targetFreq) {
  return 1200 * Math.log2(detectedFreq / targetFreq);
}
var RAW_TUNINGS = {
  cebolao_mi: {
    name: "Cebol\xE3o em Mi",
    description: "Afina\xE7\xE3o mais tradicional da viola caipira. Aberta em Mi maior.",
    rootNote: "E",
    strings: [
      { id: 0, pair: 1, type: "un\xEDssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1\xBA Par (A)" },
      { id: 1, pair: 1, type: "un\xEDssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1\xBA Par (B)" },
      { id: 2, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (A)" },
      { id: 3, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G#", octave: 4, semitonesFromA4: -1, label: "3\xBA Requinta" },
      { id: 5, pair: 3, type: "bord\xE3o", note: "G#", octave: 3, semitonesFromA4: -13, label: "3\xBA Bord\xE3o" },
      { id: 6, pair: 4, type: "requinta", note: "E", octave: 4, semitonesFromA4: -5, label: "4\xBA Requinta" },
      { id: 7, pair: 4, type: "bord\xE3o", note: "E", octave: 3, semitonesFromA4: -17, label: "4\xBA Bord\xE3o" },
      { id: 8, pair: 5, type: "requinta", note: "B", octave: 3, semitonesFromA4: -10, label: "5\xBA Requinta" },
      { id: 9, pair: 5, type: "bord\xE3o", note: "B", octave: 2, semitonesFromA4: -22, label: "5\xBA Bord\xE3o" }
    ]
  },
  cebolao_re: {
    name: "Cebol\xE3o em R\xE9",
    description: "Um tom abaixo do Cebol\xE3o em Mi. Tens\xE3o mais suave e som aveludado.",
    rootNote: "D",
    strings: [
      { id: 0, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (A)" },
      { id: 1, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (B)" },
      { id: 2, pair: 2, type: "un\xEDssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2\xBA Par (A)" },
      { id: 3, pair: 2, type: "un\xEDssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2\xBA Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "F#", octave: 4, semitonesFromA4: -3, label: "3\xBA Requinta" },
      { id: 5, pair: 3, type: "bord\xE3o", note: "F#", octave: 3, semitonesFromA4: -15, label: "3\xBA Bord\xE3o" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4\xBA Requinta" },
      { id: 7, pair: 4, type: "bord\xE3o", note: "D", octave: 3, semitonesFromA4: -19, label: "4\xBA Bord\xE3o" },
      { id: 8, pair: 5, type: "requinta", note: "A", octave: 3, semitonesFromA4: -12, label: "5\xBA Requinta" },
      { id: 9, pair: 5, type: "bord\xE3o", note: "A", octave: 2, semitonesFromA4: -24, label: "5\xBA Bord\xE3o" }
    ]
  },
  rio_abaixo: {
    name: "Rio Abaixo",
    description: "Afina\xE7\xE3o misteriosa em Sol maior, lend\xE1ria no folclore brasileiro.",
    rootNote: "G",
    strings: [
      { id: 0, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (A)" },
      { id: 1, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (B)" },
      { id: 2, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (A)" },
      { id: 3, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G", octave: 4, semitonesFromA4: -2, label: "3\xBA Requinta" },
      { id: 5, pair: 3, type: "bord\xE3o", note: "G", octave: 3, semitonesFromA4: -14, label: "3\xBA Bord\xE3o" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4\xBA Requinta" },
      { id: 7, pair: 4, type: "bord\xE3o", note: "D", octave: 3, semitonesFromA4: -19, label: "4\xBA Bord\xE3o" },
      { id: 8, pair: 5, type: "requinta", note: "G", octave: 3, semitonesFromA4: -14, label: "5\xBA Requinta" },
      { id: 9, pair: 5, type: "bord\xE3o", note: "G", octave: 2, semitonesFromA4: -26, label: "5\xBA Bord\xE3o" }
    ]
  },
  boiadeira: {
    name: "Boiadeira",
    description: "Muito utilizada no pantanal e sert\xE3o com sonoridade marcante.",
    rootNote: "G/D",
    strings: [
      { id: 0, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (A)" },
      { id: 1, pair: 1, type: "un\xEDssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1\xBA Par (B)" },
      { id: 2, pair: 2, type: "un\xEDssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2\xBA Par (A)" },
      { id: 3, pair: 2, type: "un\xEDssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2\xBA Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "F#", octave: 4, semitonesFromA4: -3, label: "3\xBA Requinta" },
      { id: 5, pair: 3, type: "bord\xE3o", note: "F#", octave: 3, semitonesFromA4: -15, label: "3\xBA Bord\xE3o" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4\xBA Requinta" },
      { id: 7, pair: 4, type: "bord\xE3o", note: "D", octave: 3, semitonesFromA4: -19, label: "4\xBA Bord\xE3o" },
      { id: 8, pair: 5, type: "requinta", note: "G", octave: 3, semitonesFromA4: -14, label: "5\xBA Requinta" },
      { id: 9, pair: 5, type: "bord\xE3o", note: "G", octave: 2, semitonesFromA4: -26, label: "5\xBA Bord\xE3o" }
    ]
  },
  natural: {
    name: "Natural / Maior",
    description: "Afina\xE7\xE3o com o 5\xBA par oitavado em Mi (Grave Mi2).",
    rootNote: "E",
    strings: [
      { id: 0, pair: 1, type: "un\xEDssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1\xBA Par (A)" },
      { id: 1, pair: 1, type: "un\xEDssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1\xBA Par (B)" },
      { id: 2, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (A)" },
      { id: 3, pair: 2, type: "un\xEDssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2\xBA Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G#", octave: 4, semitonesFromA4: -1, label: "3\xBA Requinta" },
      { id: 5, pair: 3, type: "bord\xE3o", note: "G#", octave: 3, semitonesFromA4: -13, label: "3\xBA Bord\xE3o" },
      { id: 6, pair: 4, type: "requinta", note: "E", octave: 4, semitonesFromA4: -5, label: "4\xBA Requinta" },
      { id: 7, pair: 4, type: "bord\xE3o", note: "E", octave: 3, semitonesFromA4: -17, label: "4\xBA Bord\xE3o" },
      { id: 8, pair: 5, type: "requinta", note: "E", octave: 3, semitonesFromA4: -17, label: "5\xBA Requinta" },
      { id: 9, pair: 5, type: "bord\xE3o", note: "E", octave: 2, semitonesFromA4: -29, label: "5\xBA Bord\xE3o" }
    ]
  }
};
function getTuningPresets(a4 = 440) {
  const result = {};
  for (const [key, raw] of Object.entries(RAW_TUNINGS)) {
    const strings = raw.strings.map((str) => ({
      ...str,
      frequency: calculateFrequency(str.semitonesFromA4, a4)
    }));
    result[key] = {
      key,
      name: raw.name,
      description: raw.description,
      rootNote: raw.rootNote,
      strings
    };
  }
  return result;
}

// tests/test_auto_mode.ts
var presets = getTuningPresets(440);
for (const [key, preset] of Object.entries(presets)) {
  console.log(`
================ ${preset.name} ================`);
  const freqMap = /* @__PURE__ */ new Map();
  for (const s of preset.strings) {
    const f = Math.round(s.frequency * 100) / 100;
    const list = freqMap.get(f) || [];
    list.push(`Corda ${s.id} (${s.label} - ${s.note}${s.octave})`);
    freqMap.set(f, list);
  }
  for (const [f, strings] of freqMap.entries()) {
    if (strings.length > 1) {
      console.log(`Frequ\xEAncia compartilhada: ${f} Hz:`);
      strings.forEach((str) => console.log(`   - ${str}`));
    }
  }
  console.log("\nSimula\xE7\xE3o do Auto-Mode (qual corda \xE9 selecionada para cada frequ\xEAncia):");
  for (const targetString of preset.strings) {
    let minDiff = Infinity;
    let bestString = targetString;
    for (const s of preset.strings) {
      const diff = Math.abs(calculateCents(targetString.frequency, s.frequency));
      if (diff < minDiff) {
        minDiff = diff;
        bestString = s;
      }
    }
    const isSelf = bestString.id === targetString.id;
    console.log(`  Tocando Corda ${targetString.id} (${targetString.label} ${targetString.note}${targetString.octave}) -> Auto-selecionou: Corda ${bestString.id} (${bestString.label}) [${isSelf ? "OK" : "INCORRETO/SOBREPOSTO"}]`);
  }
}
