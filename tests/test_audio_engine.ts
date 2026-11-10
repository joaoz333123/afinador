import { detectPitch } from '../src/audio/pitchDetector';
import { getTuningPresets, calculateFrequency, calculateCents } from '../src/constants/tunings';
import { TuningPreset, ViolaString } from '../src/types/tuner';

// Helper to generate synthetic audio buffers
function generateSineWave(
  freq: number,
  sampleRate: number,
  length: number,
  amplitude: number = 0.5,
  harmonics: { ratio: number; amp: number }[] = []
): Float32Array {
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

function generateWhiteNoise(length: number, amplitude: number): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = (Math.random() * 2 - 1) * amplitude;
  }
  return buffer;
}

function mixBuffers(b1: Float32Array, b2: Float32Array): Float32Array {
  const out = new Float32Array(b1.length);
  for (let i = 0; i < b1.length; i++) {
    out[i] = b1[i] + (b2[i] || 0);
  }
  return out;
}

// ----------------------------------------------------------------------
// Test 1: Mathematical & Musical Verification of Tunings
// ----------------------------------------------------------------------
console.log('=====================================================');
console.log('TEST 1: AFINAÇÕES, NOTAS, OITAVAS E FREQUÊNCIAS');
console.log('=====================================================');

const presets = getTuningPresets(440);
const expectedKeys = ['cebolao_mi', 'cebolao_re', 'rio_abaixo', 'boiadeira', 'natural'];

let mathErrors: string[] = [];

// Note to semitones from C0
const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

function getExpectedSemitonesFromA4(note: string, octave: number): number {
  const semitonesFromC0 = octave * 12 + NOTE_SEMITONES[note];
  const a4SemitonesFromC0 = 4 * 12 + NOTE_SEMITONES['A']; // 4*12 + 9 = 57
  return semitonesFromC0 - a4SemitonesFromC0;
}

for (const key of expectedKeys) {
  const preset = presets[key];
  if (!preset) {
    mathErrors.push(`Preset não encontrado: ${key}`);
    continue;
  }
  console.log(`\nVerificando afinação: ${preset.name} (${preset.key})`);
  console.log(`Descrição: ${preset.description} | Tom: ${preset.rootNote}`);

  if (preset.strings.length !== 10) {
    mathErrors.push(`${preset.name}: Esperava 10 cordas, encontrou ${preset.strings.length}`);
  }

  // Check each string definition
  for (const s of preset.strings) {
    const expectedSemi = getExpectedSemitonesFromA4(s.note, s.octave);
    if (s.semitonesFromA4 !== expectedSemi) {
      mathErrors.push(
        `${preset.name} Corda ${s.id} (${s.label} ${s.note}${s.octave}): semitonesFromA4 é ${s.semitonesFromA4}, esperado ${expectedSemi}`
      );
    }
    const expectedFreq = 440 * Math.pow(2, expectedSemi / 12);
    if (Math.abs(s.frequency - expectedFreq) > 0.001) {
      mathErrors.push(
        `${preset.name} Corda ${s.id}: frequência calculada ${s.frequency}Hz difere do esperado ${expectedFreq}Hz`
      );
    }
  }

  // Check Pair 1 & Pair 2 are unison
  const p1 = preset.strings.filter(s => s.pair === 1);
  const p2 = preset.strings.filter(s => s.pair === 2);
  const p3 = preset.strings.filter(s => s.pair === 3);
  const p4 = preset.strings.filter(s => s.pair === 4);
  const p5 = preset.strings.filter(s => s.pair === 5);

  if (p1.length !== 2 || p1[0].note !== p1[1].note || p1[0].octave !== p1[1].octave || p1[0].frequency !== p1[1].frequency) {
    mathErrors.push(`${preset.name}: Par 1 não é estritamente uníssono!`);
  }
  if (p1[0].type !== 'uníssono' || p1[1].type !== 'uníssono') {
    mathErrors.push(`${preset.name}: Par 1 tipos devem ser 'uníssono', recebido: ${p1[0].type}, ${p1[1].type}`);
  }

  if (p2.length !== 2 || p2[0].note !== p2[1].note || p2[0].octave !== p2[1].octave || p2[0].frequency !== p2[1].frequency) {
    mathErrors.push(`${preset.name}: Par 2 não é estritamente uníssono!`);
  }
  if (p2[0].type !== 'uníssono' || p2[1].type !== 'uníssono') {
    mathErrors.push(`${preset.name}: Par 2 tipos devem ser 'uníssono', recebido: ${p2[0].type}, ${p2[1].type}`);
  }

  // Check Pairs 3, 4, 5 are octave pairs (requinta = 1 oitava acima do bordão)
  for (const [pairNum, pair] of [[3, p3], [4, p4], [5, p5]] as [number, ViolaString[]][]) {
    const requinta = pair.find(s => s.type === 'requinta');
    const bordao = pair.find(s => s.type === 'bordão');
    if (!requinta || !bordao) {
      mathErrors.push(`${preset.name}: Par ${pairNum} não possui requinta e bordão definidos!`);
      continue;
    }
    if (requinta.note !== bordao.note) {
      mathErrors.push(`${preset.name}: Par ${pairNum} notas diferem: Requinta=${requinta.note}, Bordão=${bordao.note}`);
    }
    if (requinta.octave !== bordao.octave + 1) {
      mathErrors.push(`${preset.name}: Par ${pairNum} oitavas inválidas: Requinta=${requinta.octave}, Bordão=${bordao.octave} (esperado +1)`);
    }
    if (requinta.semitonesFromA4 !== bordao.semitonesFromA4 + 12) {
      mathErrors.push(`${preset.name}: Par ${pairNum} semitons de diferença: ${requinta.semitonesFromA4 - bordao.semitonesFromA4} (esperado 12)`);
    }
    const ratio = requinta.frequency / bordao.frequency;
    if (Math.abs(ratio - 2.0) > 0.0001) {
      mathErrors.push(`${preset.name}: Par ${pairNum} razão de frequências: ${ratio} (esperado 2.0)`);
    }
  }

  console.log(`  -> Todas as 10 cordas validadas:`);
  for (const s of preset.strings) {
    console.log(`     Corda ${s.id} [${s.pair}º Par]: ${s.label.padEnd(14)} ${s.note}${s.octave} (${s.type.padEnd(8)}) = ${s.frequency.toFixed(2)} Hz`);
  }
}

console.log(`\nResultado Teste 1: ${mathErrors.length === 0 ? 'SUCESSO TOTAL (0 erros)' : `FALHA (${mathErrors.length} erros)`}`);
if (mathErrors.length > 0) {
  console.error('Erros matemáticos encontrados:', mathErrors);
}

// ----------------------------------------------------------------------
// Test 2: Calibração A4 (430Hz a 450Hz)
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('TEST 2: CALIBRAÇÃO A4 (430Hz - 450Hz)');
console.log('=====================================================');

let calibErrors: string[] = [];
for (const a4 of [430, 432, 440, 442, 444, 450]) {
  const p = getTuningPresets(a4);
  const ceb = p['cebolao_mi'];
  for (const s of ceb.strings) {
    const expected = a4 * Math.pow(2, s.semitonesFromA4 / 12);
    if (Math.abs(s.frequency - expected) > 0.001) {
      calibErrors.push(`A4=${a4} Corda ${s.id} freq=${s.frequency}, esperado=${expected}`);
    }
  }
}
console.log(`Resultado Teste 2: ${calibErrors.length === 0 ? 'SUCESSO TOTAL (0 erros)' : `FALHA (${calibErrors.length} erros)`}`);


// ----------------------------------------------------------------------
// Test 3: Algoritmo detectPitch em todas as cordas e afinações
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('TEST 3: ALGORITMO DETECTPITCH - PURE SINE WAVES');
console.log('=====================================================');

const sampleRates = [44100, 48000];
const bufferSize = 2048; // analyser.fftSize
let pitchErrors: string[] = [];

for (const sr of sampleRates) {
  console.log(`\n--- Testando Taxa de Amostragem: ${sr} Hz ---`);
  for (const key of expectedKeys) {
    const preset = presets[key];
    console.log(`\nAfinação: ${preset.name} (${sr} Hz)`);
    for (const s of preset.strings) {
      // 1. Pure sine wave
      const buffer = generateSineWave(s.frequency, sr, bufferSize, 0.5);
      const res = detectPitch(buffer, sr, 0.15);

      if (res.detectedFreq <= 0) {
        pitchErrors.push(`[${sr}Hz] ${preset.name} Corda ${s.id} (${s.label} ${s.frequency.toFixed(2)}Hz): NÃO DETECTADO (retornou -1)`);
        console.log(`  ❌ Corda ${s.id} [${s.label}]: ALVO ${s.frequency.toFixed(2)} Hz -> NÃO DETECTOU! RMS: ${res.rms.toFixed(4)}`);
      } else {
        const centsDev = calculateCents(res.detectedFreq, s.frequency);
        const isAccurate = Math.abs(centsDev) <= 3.5;
        if (!isAccurate) {
          pitchErrors.push(`[${sr}Hz] ${preset.name} Corda ${s.id}: Alvo ${s.frequency.toFixed(2)}Hz, Detectado ${res.detectedFreq.toFixed(2)}Hz (${centsDev.toFixed(2)} cents)`);
        }
        console.log(`  ${isAccurate ? '✅' : '⚠️'} Corda ${s.id} [${s.label}]: Alvo ${s.frequency.toFixed(2)} Hz -> Det: ${res.detectedFreq.toFixed(2)} Hz (Erro: ${centsDev.toFixed(2)} cents)`);
      }
    }
  }
}


// ----------------------------------------------------------------------
// Test 4: Algoritmo com Harmônicos Acústicos (Timbre de Viola)
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('TEST 4: ALGORITMO DETECTPITCH - TIMBRE DE VIOLA (HARMÔNICOS)');
console.log('=====================================================');

let harmonicErrors: string[] = [];
const sr = 48000;
const cebolao = presets['cebolao_mi'];

for (const s of cebolao.strings) {
  // Fundamental + 2nd harmonic (0.6) + 3rd harmonic (0.3)
  const harmonics = [
    { ratio: 2, amp: 0.6 },
    { ratio: 3, amp: 0.3 }
  ];
  const buffer = generateSineWave(s.frequency, sr, bufferSize, 0.4, harmonics);
  const res = detectPitch(buffer, sr, 0.15);

  if (res.detectedFreq <= 0) {
    harmonicErrors.push(`Corda ${s.id} (${s.label}): NÃO DETECTADO com harmônicos`);
    console.log(`  ❌ Corda ${s.id} [${s.label}]: ${s.frequency.toFixed(2)} Hz -> NÃO DETECTOU`);
  } else {
    const centsDev = calculateCents(res.detectedFreq, s.frequency);
    const isAccurate = Math.abs(centsDev) <= 5.0;
    // Also check if octave confusion occurred (detected frequency 2x or 3x)
    const octaveRatio = res.detectedFreq / s.frequency;
    const isOctaveError = Math.abs(octaveRatio - 2.0) < 0.1 || Math.abs(octaveRatio - 3.0) < 0.1;

    if (isOctaveError) {
      harmonicErrors.push(`Corda ${s.id} (${s.label}): CONFUSÃO DE OITAVA! Detectou harmônico ${res.detectedFreq.toFixed(2)}Hz em vez do fundamental ${s.frequency.toFixed(2)}Hz`);
      console.log(`  ❌ Corda ${s.id} [${s.label}]: Confusão de oitava! Det: ${res.detectedFreq.toFixed(2)} Hz vs Alvo: ${s.frequency.toFixed(2)} Hz`);
    } else {
      console.log(`  ${isAccurate ? '✅' : '⚠️'} Corda ${s.id} [${s.label}]: Alvo ${s.frequency.toFixed(2)} Hz -> Det: ${res.detectedFreq.toFixed(2)} Hz (Erro: ${centsDev.toFixed(2)} cents)`);
    }
  }
}


// ----------------------------------------------------------------------
// Test 5: Desafinação (+-40 cents, +-20 cents, +-3.5 cents)
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('TEST 5: TESTE DE DESAFINAÇÃO E AÇÕES (TOO_LOW, TOO_HIGH, IN_TUNE)');
console.log('=====================================================');

let detuneErrors: string[] = [];
const testCentsList = [-40, -25, -15, -3, 0, +3, +15, +25, +40];

for (const centsTarget of testCentsList) {
  // Test on 1st string (E4, 329.63 Hz) and 5th string bordão (B2, 123.47 Hz)
  for (const s of [cebolao.strings[0], cebolao.strings[9]]) {
    const detunedFreq = s.frequency * Math.pow(2, centsTarget / 1200);
    const buffer = generateSineWave(detunedFreq, sr, bufferSize, 0.5);
    const res = detectPitch(buffer, sr, 0.15);

    if (res.detectedFreq <= 0) {
      detuneErrors.push(`Desafinação ${centsTarget}c em ${s.label}: Não detectado`);
      console.log(`  ❌ ${s.label} (${centsTarget} cents): Não detectado`);
      continue;
    }

    const measuredCents = calculateCents(res.detectedFreq, s.frequency);
    const errorInCents = Math.abs(measuredCents - centsTarget);

    let action = 'idle';
    if (Math.abs(measuredCents) <= 3.5) action = 'in_tune';
    else if (measuredCents < 0) action = 'too_low';
    else action = 'too_high';

    let expectedAction = 'idle';
    if (Math.abs(centsTarget) <= 3.5) expectedAction = 'in_tune';
    else if (centsTarget < 0) expectedAction = 'too_low';
    else expectedAction = 'too_high';

    const match = action === expectedAction;
    if (!match || errorInCents > 2.0) {
      detuneErrors.push(`${s.label} @ ${centsTarget}c: esperado ${expectedAction}, deu ${action} (Erro: ${errorInCents.toFixed(2)} cents)`);
    }
    console.log(`  ${match ? '✅' : '❌'} ${s.label} @ ${centsTarget > 0 ? '+' : ''}${centsTarget}c -> Medido: ${measuredCents > 0 ? '+' : ''}${measuredCents.toFixed(1)}c | Ação: ${action} (Esperado: ${expectedAction})`);
  }
}


// ----------------------------------------------------------------------
// Test 6: Noise Gate, Silêncio, Baixa Amplitude e Ruído Branco
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('TEST 6: NOISE GATE, SILÊNCIO E RUÍDO');
console.log('=====================================================');

let noiseErrors: string[] = [];

// 6.1 Total silence
const silenceBuffer = new Float32Array(bufferSize);
const silenceRes = detectPitch(silenceBuffer, sr, 0.15);
console.log(`Silêncio absoluto: freq=${silenceRes.detectedFreq}, rms=${silenceRes.rms}`);
if (silenceRes.detectedFreq !== -1) {
  noiseErrors.push(`Silêncio absoluto produziu detecção: ${silenceRes.detectedFreq}Hz`);
}

// 6.2 Low ambient hiss below gate
const hissBuffer = generateWhiteNoise(bufferSize, 0.003); // RMS ~ 0.0017
const hissRes = detectPitch(hissBuffer, sr, 0.15);
console.log(`Ruído leve abaixo do gate (amp 0.003): freq=${hissRes.detectedFreq}, rms=${hissRes.rms.toFixed(5)}`);
if (hissRes.detectedFreq !== -1) {
  noiseErrors.push(`Ruído leve abaixo do gate produziu detecção: ${hissRes.detectedFreq}Hz`);
}

// 6.3 Signal + moderate background noise (SNR ~ 15dB)
const signalBuffer = generateSineWave(329.63, sr, bufferSize, 0.3);
const noiseBuffer = generateWhiteNoise(bufferSize, 0.03);
const noisySignal = mixBuffers(signalBuffer, noiseBuffer);
const noisyRes = detectPitch(noisySignal, sr, 0.15);
console.log(`Sinal E4 + Ruído (amp 0.03): freq=${noisyRes.detectedFreq.toFixed(2)}, rms=${noisyRes.rms.toFixed(4)}`);
if (noisyRes.detectedFreq <= 0 || Math.abs(calculateCents(noisyRes.detectedFreq, 329.63)) > 10) {
  noiseErrors.push(`Falha na detecção com ruído moderado: det=${noisyRes.detectedFreq}`);
}

// 6.4 Low amplitude signal: what if string is decaying (amplitude = 0.05 or 0.08)?
console.log('\n--- Teste de Sensibilidade com Sinal Fraco (Decaimento da Corda) ---');
for (const amp of [0.2, 0.1, 0.08, 0.05, 0.03, 0.02, 0.01]) {
  const weakBuf = generateSineWave(329.63, sr, bufferSize, amp);
  const weakRes = detectPitch(weakBuf, sr, 0.15);
  const detected = weakRes.detectedFreq > 0;
  console.log(`  Amp ${amp.toFixed(2)} (RMS ${weakRes.rms.toFixed(4)}): ${detected ? `✅ Detectou ${weakRes.detectedFreq.toFixed(1)} Hz` : `❌ NÃO detectou (retornou ${weakRes.detectedFreq})`}`);
}

// 6.5 Edge Truncation Check: What happens in line 30-46 of pitchDetector?
console.log('\n--- Teste da Truncagem de Borda (edgeThreshold = 0.15) ---');
// Let's test a signal whose peak is 0.12 (above noise gate minimumRms ~ 0.005, but below edgeThreshold 0.15)
const midAmpBuf = generateSineWave(329.63, sr, bufferSize, 0.12);
const midAmpRes = detectPitch(midAmpBuf, sr, 0.15);
console.log(`  Sinal com amplitude 0.12 (RMS ${midAmpRes.rms.toFixed(4)}): detectPitch = ${midAmpRes.detectedFreq}`);

// ----------------------------------------------------------------------
// SUMMARY OF TEST RESULTS
// ----------------------------------------------------------------------
console.log('\n=====================================================');
console.log('RESUMO DOS RESULTADOS DOS TESTES');
console.log('=====================================================');
console.log(`Erros Matemáticos/Afinações: ${mathErrors.length}`);
console.log(`Erros Calibração A4: ${calibErrors.length}`);
console.log(`Erros Pure Sine Pitch: ${pitchErrors.length}`);
console.log(`Erros Harmônicos: ${harmonicErrors.length}`);
console.log(`Erros Desafinação: ${detuneErrors.length}`);
console.log(`Erros Noise Gate / Ruído: ${noiseErrors.length}`);
