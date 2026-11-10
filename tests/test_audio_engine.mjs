// src/audio/pitchDetector.ts
function detectPitch(buffer, sampleRate, noiseGateThreshold) {
  const SIZE = buffer.length;
  let sumSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / SIZE);
  const minimumRms = noiseGateThreshold * 0.02 + 2e-3;
  if (rms < minimumRms) {
    return { detectedFreq: -1, rms };
  }
  let r1 = 0;
  let r2 = SIZE - 1;
  const edgeThreshold = 0.15;
  for (let i = 0; i < Math.floor(SIZE / 2); i++) {
    if (Math.abs(buffer[i]) < edgeThreshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < Math.floor(SIZE / 2); i++) {
    if (Math.abs(buffer[SIZE - i]) < edgeThreshold) {
      r2 = SIZE - i;
      break;
    }
  }
  const bufSlice = buffer.subarray(r1, r2);
  const sliceLen = bufSlice.length;
  if (sliceLen < 512) {
    return { detectedFreq: -1, rms };
  }
  const minPeriod = Math.floor(sampleRate / 750);
  const maxPeriod = Math.min(sliceLen - 1, Math.floor(sampleRate / 75));
  const correlation = new Float32Array(maxPeriod + 2);
  for (let offset = 0; offset <= maxPeriod; offset++) {
    let sum = 0;
    const len = sliceLen - offset;
    for (let j = 0; j < len; j++) {
      sum += bufSlice[j] * bufSlice[j + offset];
    }
    correlation[offset] = sum;
  }
  let d = 0;
  while (d < maxPeriod && correlation[d] > correlation[d + 1]) {
    d++;
  }
  let maxVal = -1;
  let maxPos = -1;
  for (let i = Math.max(d, minPeriod); i <= maxPeriod; i++) {
    if (correlation[i] > maxVal) {
      maxVal = correlation[i];
      maxPos = i;
    }
  }
  if (maxPos > 0 && maxVal > correlation[0] * 0.3) {
    let T0 = maxPos;
    if (T0 > 0 && T0 < maxPeriod) {
      const x1 = correlation[T0 - 1];
      const x2 = correlation[T0];
      const x3 = correlation[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a !== 0) {
        T0 = T0 - b / (2 * a);
      }
    }
    const fundamentalFreq = sampleRate / T0;
    if (fundamentalFreq >= 70 && fundamentalFreq <= 800) {
      return { detectedFreq: fundamentalFreq, rms };
    }
  }
  return { detectedFreq: -1, rms };
}

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

// tests/test_audio_engine.ts
function generateSineWave(freq, sampleRate, length, amplitude = 0.5, harmonics = []) {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = amplitude * Math.sin(2 * Math.PI * freq * t);
    for (const h of harmonics) {
      sample += h.amp * amplitude * Math.sin(2 * Math.PI * freq * h.ratio * t);
    }
    buffer[i] = sample;
  }
  return buffer;
}
function generateWhiteNoise(length, amplitude) {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = (Math.random() * 2 - 1) * amplitude;
  }
  return buffer;
}
function mixBuffers(b1, b2) {
  const out = new Float32Array(b1.length);
  for (let i = 0; i < b1.length; i++) {
    out[i] = b1[i] + (b2[i] || 0);
  }
  return out;
}
console.log("=====================================================");
console.log("TEST 1: AFINA\xC7\xD5ES, NOTAS, OITAVAS E FREQU\xCANCIAS");
console.log("=====================================================");
var presets = getTuningPresets(440);
var expectedKeys = ["cebolao_mi", "cebolao_re", "rio_abaixo", "boiadeira", "natural"];
var mathErrors = [];
var NOTE_SEMITONES = {
  "C": 0,
  "C#": 1,
  "Db": 1,
  "D": 2,
  "D#": 3,
  "Eb": 3,
  "E": 4,
  "F": 5,
  "F#": 6,
  "Gb": 6,
  "G": 7,
  "G#": 8,
  "Ab": 8,
  "A": 9,
  "A#": 10,
  "Bb": 10,
  "B": 11
};
function getExpectedSemitonesFromA4(note, octave) {
  const semitonesFromC0 = octave * 12 + NOTE_SEMITONES[note];
  const a4SemitonesFromC0 = 4 * 12 + NOTE_SEMITONES["A"];
  return semitonesFromC0 - a4SemitonesFromC0;
}
for (const key of expectedKeys) {
  const preset = presets[key];
  if (!preset) {
    mathErrors.push(`Preset n\xE3o encontrado: ${key}`);
    continue;
  }
  console.log(`
Verificando afina\xE7\xE3o: ${preset.name} (${preset.key})`);
  console.log(`Descri\xE7\xE3o: ${preset.description} | Tom: ${preset.rootNote}`);
  if (preset.strings.length !== 10) {
    mathErrors.push(`${preset.name}: Esperava 10 cordas, encontrou ${preset.strings.length}`);
  }
  for (const s of preset.strings) {
    const expectedSemi = getExpectedSemitonesFromA4(s.note, s.octave);
    if (s.semitonesFromA4 !== expectedSemi) {
      mathErrors.push(
        `${preset.name} Corda ${s.id} (${s.label} ${s.note}${s.octave}): semitonesFromA4 \xE9 ${s.semitonesFromA4}, esperado ${expectedSemi}`
      );
    }
    const expectedFreq = 440 * Math.pow(2, expectedSemi / 12);
    if (Math.abs(s.frequency - expectedFreq) > 1e-3) {
      mathErrors.push(
        `${preset.name} Corda ${s.id}: frequ\xEAncia calculada ${s.frequency}Hz difere do esperado ${expectedFreq}Hz`
      );
    }
  }
  const p1 = preset.strings.filter((s) => s.pair === 1);
  const p2 = preset.strings.filter((s) => s.pair === 2);
  const p3 = preset.strings.filter((s) => s.pair === 3);
  const p4 = preset.strings.filter((s) => s.pair === 4);
  const p5 = preset.strings.filter((s) => s.pair === 5);
  if (p1.length !== 2 || p1[0].note !== p1[1].note || p1[0].octave !== p1[1].octave || p1[0].frequency !== p1[1].frequency) {
    mathErrors.push(`${preset.name}: Par 1 n\xE3o \xE9 estritamente un\xEDssono!`);
  }
  if (p1[0].type !== "un\xEDssono" || p1[1].type !== "un\xEDssono") {
    mathErrors.push(`${preset.name}: Par 1 tipos devem ser 'un\xEDssono', recebido: ${p1[0].type}, ${p1[1].type}`);
  }
  if (p2.length !== 2 || p2[0].note !== p2[1].note || p2[0].octave !== p2[1].octave || p2[0].frequency !== p2[1].frequency) {
    mathErrors.push(`${preset.name}: Par 2 n\xE3o \xE9 estritamente un\xEDssono!`);
  }
  if (p2[0].type !== "un\xEDssono" || p2[1].type !== "un\xEDssono") {
    mathErrors.push(`${preset.name}: Par 2 tipos devem ser 'un\xEDssono', recebido: ${p2[0].type}, ${p2[1].type}`);
  }
  for (const [pairNum, pair] of [[3, p3], [4, p4], [5, p5]]) {
    const requinta = pair.find((s) => s.type === "requinta");
    const bordao = pair.find((s) => s.type === "bord\xE3o");
    if (!requinta || !bordao) {
      mathErrors.push(`${preset.name}: Par ${pairNum} n\xE3o possui requinta e bord\xE3o definidos!`);
      continue;
    }
    if (requinta.note !== bordao.note) {
      mathErrors.push(`${preset.name}: Par ${pairNum} notas diferem: Requinta=${requinta.note}, Bord\xE3o=${bordao.note}`);
    }
    if (requinta.octave !== bordao.octave + 1) {
      mathErrors.push(`${preset.name}: Par ${pairNum} oitavas inv\xE1lidas: Requinta=${requinta.octave}, Bord\xE3o=${bordao.octave} (esperado +1)`);
    }
    if (requinta.semitonesFromA4 !== bordao.semitonesFromA4 + 12) {
      mathErrors.push(`${preset.name}: Par ${pairNum} semitons de diferen\xE7a: ${requinta.semitonesFromA4 - bordao.semitonesFromA4} (esperado 12)`);
    }
    const ratio = requinta.frequency / bordao.frequency;
    if (Math.abs(ratio - 2) > 1e-4) {
      mathErrors.push(`${preset.name}: Par ${pairNum} raz\xE3o de frequ\xEAncias: ${ratio} (esperado 2.0)`);
    }
  }
  console.log(`  -> Todas as 10 cordas validadas:`);
  for (const s of preset.strings) {
    console.log(`     Corda ${s.id} [${s.pair}\xBA Par]: ${s.label.padEnd(14)} ${s.note}${s.octave} (${s.type.padEnd(8)}) = ${s.frequency.toFixed(2)} Hz`);
  }
}
console.log(`
Resultado Teste 1: ${mathErrors.length === 0 ? "SUCESSO TOTAL (0 erros)" : `FALHA (${mathErrors.length} erros)`}`);
if (mathErrors.length > 0) {
  console.error("Erros matem\xE1ticos encontrados:", mathErrors);
}
console.log("\n=====================================================");
console.log("TEST 2: CALIBRA\xC7\xC3O A4 (430Hz - 450Hz)");
console.log("=====================================================");
var calibErrors = [];
for (const a4 of [430, 432, 440, 442, 444, 450]) {
  const p = getTuningPresets(a4);
  const ceb = p["cebolao_mi"];
  for (const s of ceb.strings) {
    const expected = a4 * Math.pow(2, s.semitonesFromA4 / 12);
    if (Math.abs(s.frequency - expected) > 1e-3) {
      calibErrors.push(`A4=${a4} Corda ${s.id} freq=${s.frequency}, esperado=${expected}`);
    }
  }
}
console.log(`Resultado Teste 2: ${calibErrors.length === 0 ? "SUCESSO TOTAL (0 erros)" : `FALHA (${calibErrors.length} erros)`}`);
console.log("\n=====================================================");
console.log("TEST 3: ALGORITMO DETECTPITCH - PURE SINE WAVES");
console.log("=====================================================");
var sampleRates = [44100, 48e3];
var bufferSize = 2048;
var pitchErrors = [];
for (const sr2 of sampleRates) {
  console.log(`
--- Testando Taxa de Amostragem: ${sr2} Hz ---`);
  for (const key of expectedKeys) {
    const preset = presets[key];
    console.log(`
Afina\xE7\xE3o: ${preset.name} (${sr2} Hz)`);
    for (const s of preset.strings) {
      const buffer = generateSineWave(s.frequency, sr2, bufferSize, 0.5);
      const res = detectPitch(buffer, sr2, 0.15);
      if (res.detectedFreq <= 0) {
        pitchErrors.push(`[${sr2}Hz] ${preset.name} Corda ${s.id} (${s.label} ${s.frequency.toFixed(2)}Hz): N\xC3O DETECTADO (retornou -1)`);
        console.log(`  \u274C Corda ${s.id} [${s.label}]: ALVO ${s.frequency.toFixed(2)} Hz -> N\xC3O DETECTOU! RMS: ${res.rms.toFixed(4)}`);
      } else {
        const centsDev = calculateCents(res.detectedFreq, s.frequency);
        const isAccurate = Math.abs(centsDev) <= 3.5;
        if (!isAccurate) {
          pitchErrors.push(`[${sr2}Hz] ${preset.name} Corda ${s.id}: Alvo ${s.frequency.toFixed(2)}Hz, Detectado ${res.detectedFreq.toFixed(2)}Hz (${centsDev.toFixed(2)} cents)`);
        }
        console.log(`  ${isAccurate ? "\u2705" : "\u26A0\uFE0F"} Corda ${s.id} [${s.label}]: Alvo ${s.frequency.toFixed(2)} Hz -> Det: ${res.detectedFreq.toFixed(2)} Hz (Erro: ${centsDev.toFixed(2)} cents)`);
      }
    }
  }
}
console.log("\n=====================================================");
console.log("TEST 4: ALGORITMO DETECTPITCH - TIMBRE DE VIOLA (HARM\xD4NICOS)");
console.log("=====================================================");
var harmonicErrors = [];
var sr = 48e3;
var cebolao = presets["cebolao_mi"];
for (const s of cebolao.strings) {
  const harmonics = [
    { ratio: 2, amp: 0.6 },
    { ratio: 3, amp: 0.3 }
  ];
  const buffer = generateSineWave(s.frequency, sr, bufferSize, 0.4, harmonics);
  const res = detectPitch(buffer, sr, 0.15);
  if (res.detectedFreq <= 0) {
    harmonicErrors.push(`Corda ${s.id} (${s.label}): N\xC3O DETECTADO com harm\xF4nicos`);
    console.log(`  \u274C Corda ${s.id} [${s.label}]: ${s.frequency.toFixed(2)} Hz -> N\xC3O DETECTOU`);
  } else {
    const centsDev = calculateCents(res.detectedFreq, s.frequency);
    const isAccurate = Math.abs(centsDev) <= 5;
    const octaveRatio = res.detectedFreq / s.frequency;
    const isOctaveError = Math.abs(octaveRatio - 2) < 0.1 || Math.abs(octaveRatio - 3) < 0.1;
    if (isOctaveError) {
      harmonicErrors.push(`Corda ${s.id} (${s.label}): CONFUS\xC3O DE OITAVA! Detectou harm\xF4nico ${res.detectedFreq.toFixed(2)}Hz em vez do fundamental ${s.frequency.toFixed(2)}Hz`);
      console.log(`  \u274C Corda ${s.id} [${s.label}]: Confus\xE3o de oitava! Det: ${res.detectedFreq.toFixed(2)} Hz vs Alvo: ${s.frequency.toFixed(2)} Hz`);
    } else {
      console.log(`  ${isAccurate ? "\u2705" : "\u26A0\uFE0F"} Corda ${s.id} [${s.label}]: Alvo ${s.frequency.toFixed(2)} Hz -> Det: ${res.detectedFreq.toFixed(2)} Hz (Erro: ${centsDev.toFixed(2)} cents)`);
    }
  }
}
console.log("\n=====================================================");
console.log("TEST 5: TESTE DE DESAFINA\xC7\xC3O E A\xC7\xD5ES (TOO_LOW, TOO_HIGH, IN_TUNE)");
console.log("=====================================================");
var detuneErrors = [];
var testCentsList = [-40, -25, -15, -3, 0, 3, 15, 25, 40];
for (const centsTarget of testCentsList) {
  for (const s of [cebolao.strings[0], cebolao.strings[9]]) {
    const detunedFreq = s.frequency * Math.pow(2, centsTarget / 1200);
    const buffer = generateSineWave(detunedFreq, sr, bufferSize, 0.5);
    const res = detectPitch(buffer, sr, 0.15);
    if (res.detectedFreq <= 0) {
      detuneErrors.push(`Desafina\xE7\xE3o ${centsTarget}c em ${s.label}: N\xE3o detectado`);
      console.log(`  \u274C ${s.label} (${centsTarget} cents): N\xE3o detectado`);
      continue;
    }
    const measuredCents = calculateCents(res.detectedFreq, s.frequency);
    const errorInCents = Math.abs(measuredCents - centsTarget);
    let action = "idle";
    if (Math.abs(measuredCents) <= 3.5) action = "in_tune";
    else if (measuredCents < 0) action = "too_low";
    else action = "too_high";
    let expectedAction = "idle";
    if (Math.abs(centsTarget) <= 3.5) expectedAction = "in_tune";
    else if (centsTarget < 0) expectedAction = "too_low";
    else expectedAction = "too_high";
    const match = action === expectedAction;
    if (!match || errorInCents > 2) {
      detuneErrors.push(`${s.label} @ ${centsTarget}c: esperado ${expectedAction}, deu ${action} (Erro: ${errorInCents.toFixed(2)} cents)`);
    }
    console.log(`  ${match ? "\u2705" : "\u274C"} ${s.label} @ ${centsTarget > 0 ? "+" : ""}${centsTarget}c -> Medido: ${measuredCents > 0 ? "+" : ""}${measuredCents.toFixed(1)}c | A\xE7\xE3o: ${action} (Esperado: ${expectedAction})`);
  }
}
console.log("\n=====================================================");
console.log("TEST 6: NOISE GATE, SIL\xCANCIO E RU\xCDDO");
console.log("=====================================================");
var noiseErrors = [];
var silenceBuffer = new Float32Array(bufferSize);
var silenceRes = detectPitch(silenceBuffer, sr, 0.15);
console.log(`Sil\xEAncio absoluto: freq=${silenceRes.detectedFreq}, rms=${silenceRes.rms}`);
if (silenceRes.detectedFreq !== -1) {
  noiseErrors.push(`Sil\xEAncio absoluto produziu detec\xE7\xE3o: ${silenceRes.detectedFreq}Hz`);
}
var hissBuffer = generateWhiteNoise(bufferSize, 3e-3);
var hissRes = detectPitch(hissBuffer, sr, 0.15);
console.log(`Ru\xEDdo leve abaixo do gate (amp 0.003): freq=${hissRes.detectedFreq}, rms=${hissRes.rms.toFixed(5)}`);
if (hissRes.detectedFreq !== -1) {
  noiseErrors.push(`Ru\xEDdo leve abaixo do gate produziu detec\xE7\xE3o: ${hissRes.detectedFreq}Hz`);
}
var signalBuffer = generateSineWave(329.63, sr, bufferSize, 0.3);
var noiseBuffer = generateWhiteNoise(bufferSize, 0.03);
var noisySignal = mixBuffers(signalBuffer, noiseBuffer);
var noisyRes = detectPitch(noisySignal, sr, 0.15);
console.log(`Sinal E4 + Ru\xEDdo (amp 0.03): freq=${noisyRes.detectedFreq.toFixed(2)}, rms=${noisyRes.rms.toFixed(4)}`);
if (noisyRes.detectedFreq <= 0 || Math.abs(calculateCents(noisyRes.detectedFreq, 329.63)) > 10) {
  noiseErrors.push(`Falha na detec\xE7\xE3o com ru\xEDdo moderado: det=${noisyRes.detectedFreq}`);
}
console.log("\n--- Teste de Sensibilidade com Sinal Fraco (Decaimento da Corda) ---");
for (const amp of [0.2, 0.1, 0.08, 0.05, 0.03, 0.02, 0.01]) {
  const weakBuf = generateSineWave(329.63, sr, bufferSize, amp);
  const weakRes = detectPitch(weakBuf, sr, 0.15);
  const detected = weakRes.detectedFreq > 0;
  console.log(`  Amp ${amp.toFixed(2)} (RMS ${weakRes.rms.toFixed(4)}): ${detected ? `\u2705 Detectou ${weakRes.detectedFreq.toFixed(1)} Hz` : `\u274C N\xC3O detectou (retornou ${weakRes.detectedFreq})`}`);
}
console.log("\n--- Teste da Truncagem de Borda (edgeThreshold = 0.15) ---");
var midAmpBuf = generateSineWave(329.63, sr, bufferSize, 0.12);
var midAmpRes = detectPitch(midAmpBuf, sr, 0.15);
console.log(`  Sinal com amplitude 0.12 (RMS ${midAmpRes.rms.toFixed(4)}): detectPitch = ${midAmpRes.detectedFreq}`);
console.log("\n=====================================================");
console.log("RESUMO DOS RESULTADOS DOS TESTES");
console.log("=====================================================");
console.log(`Erros Matem\xE1ticos/Afina\xE7\xF5es: ${mathErrors.length}`);
console.log(`Erros Calibra\xE7\xE3o A4: ${calibErrors.length}`);
console.log(`Erros Pure Sine Pitch: ${pitchErrors.length}`);
console.log(`Erros Harm\xF4nicos: ${harmonicErrors.length}`);
console.log(`Erros Desafina\xE7\xE3o: ${detuneErrors.length}`);
console.log(`Erros Noise Gate / Ru\xEDdo: ${noiseErrors.length}`);
