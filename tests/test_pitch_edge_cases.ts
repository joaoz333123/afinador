import { detectPitch } from '../src/audio/pitchDetector';

const sr = 48000;
const bufferSize = 2048;

function testDCOffset() {
  console.log('--- Teste com DC Offset ---');
  for (const offset of [0.0, 0.05, 0.1, 0.16, 0.25]) {
    const buf = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      buf[i] = 0.4 * Math.sin(2 * Math.PI * 329.63 * (i / sr)) + offset;
    }
    const res = detectPitch(buf, sr, 0.15);
    console.log(`DC Offset ${offset.toFixed(2)}: detectFreq = ${res.detectedFreq.toFixed(2)}, rms = ${res.rms.toFixed(4)}`);
  }
}

function testEdgeThresholdWithHighMin() {
  console.log('\n--- Teste com sinal onde abs(buffer[i]) nunca cai abaixo de 0.15 (offset alto) ---');
  const buf = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buf[i] = 0.1 * Math.sin(2 * Math.PI * 329.63 * (i / sr)) + 0.3; // all values between 0.2 and 0.4
  }
  const res = detectPitch(buf, sr, 0.15);
  console.log(`Sinal sem transição < 0.15: detectFreq = ${res.detectedFreq}, rms = ${res.rms.toFixed(4)}`);
}

function testLowFrequencies() {
  console.log('\n--- Teste de Frequências Graves Extremas ---');
  // In Natural tuning with A4=430Hz, E2 is 80.53 Hz.
  // What about D2 (73.4 Hz) or C2 (65.4 Hz)?
  for (const freq of [82.41, 80.53, 75.0, 72.0, 69.0]) {
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
