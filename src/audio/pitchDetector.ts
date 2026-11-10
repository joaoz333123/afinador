import { PitchDetectionResult } from '../types/tuner';

/**
 * Normalized Autocorrelation algorithm with parabolic interpolation.
 * Robust against amplitude variations and overtone confusion.
 * Calibrated specifically for Viola Caipira frequency range (75 Hz to 750 Hz).
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  noiseGateThreshold: number
): PitchDetectionResult {
  const SIZE = buffer.length;

  // 1. Calculate RMS energy
  let sumSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / SIZE);

  // 2. Adaptive noise gate check
  // threshold scaled: 15% -> ~0.005, 5% -> ~0.003, 40% -> ~0.010
  const minimumRms = (noiseGateThreshold * 0.02) + 0.002;
  if (rms < minimumRms) {
    return { detectedFreq: -1, rms };
  }

  // 3. Truncate low-energy edges of the buffer for cleaner periodicity
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

  // 4. Autocorrelation over the slice
  const minPeriod = Math.floor(sampleRate / 750); // ~64 samples @ 48k (750 Hz)
  const maxPeriod = Math.min(sliceLen - 1, Math.floor(sampleRate / 75)); // ~640 samples @ 48k (75 Hz)

  const correlation = new Float32Array(maxPeriod + 2);
  for (let offset = 0; offset <= maxPeriod; offset++) {
    let sum = 0;
    const len = sliceLen - offset;
    for (let j = 0; j < len; j++) {
      sum += bufSlice[j] * bufSlice[j + offset];
    }
    correlation[offset] = sum;
  }

  // 5. Find the first local trough to skip the zero-lag peak
  let d = 0;
  while (d < maxPeriod && correlation[d] > correlation[d + 1]) {
    d++;
  }

  // 6. Find the maximum correlation peak after the initial drop
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

    // 7. Parabolic interpolation for sub-bin precision
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
