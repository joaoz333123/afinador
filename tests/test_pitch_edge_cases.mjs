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

// tests/test_pitch_edge_cases.ts
var sr = 48e3;
var bufferSize = 2048;
function testDCOffset() {
  console.log("--- Teste com DC Offset ---");
  for (const offset of [0, 0.05, 0.1, 0.16, 0.25]) {
    const buf = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      buf[i] = 0.4 * Math.sin(2 * Math.PI * 329.63 * (i / sr)) + offset;
    }
    const res = detectPitch(buf, sr, 0.15);
    console.log(`DC Offset ${offset.toFixed(2)}: detectFreq = ${res.detectedFreq.toFixed(2)}, rms = ${res.rms.toFixed(4)}`);
  }
}
function testEdgeThresholdWithHighMin() {
  console.log("\n--- Teste com sinal onde abs(buffer[i]) nunca cai abaixo de 0.15 (offset alto) ---");
  const buf = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buf[i] = 0.1 * Math.sin(2 * Math.PI * 329.63 * (i / sr)) + 0.3;
  }
  const res = detectPitch(buf, sr, 0.15);
  console.log(`Sinal sem transi\xE7\xE3o < 0.15: detectFreq = ${res.detectedFreq}, rms = ${res.rms.toFixed(4)}`);
}
function testLowFrequencies() {
  console.log("\n--- Teste de Frequ\xEAncias Graves Extremas ---");
  for (const freq of [82.41, 80.53, 75, 72, 69]) {
    const buf = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      buf[i] = 0.5 * Math.sin(2 * Math.PI * freq * (i / sr));
    }
    const res = detectPitch(buf, sr, 0.15);
    console.log(`Freq ${freq.toFixed(2)} Hz: detectFreq = ${res.detectedFreq.toFixed(2)}`);
  }
}
testDCOffset();
testEdgeThresholdWithHighMin();
testLowFrequencies();
