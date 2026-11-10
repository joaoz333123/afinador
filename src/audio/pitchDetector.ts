import { PitchDetectionResult } from '../types/tuner';

/**
 * Autocorrelation algorithm with parabolic interpolation
 * Tuned specifically for Viola Caipira frequency range (75 Hz to 750 Hz)
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  noiseGateThreshold: number
): PitchDetectionResult {
  const SIZE = buffer.length;

  // 1. Calculate RMS volume
  let sumSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / SIZE);

  // 2. Check noise gate (threshold scaled to standard mic levels)
  const minimumRms = noiseGateThreshold * 0.12;
  if (rms < minimumRms) {
    return { detectedFreq: -1, rms };
  }

  // 3. Viola caipira search bounds:
  // Min frequency ~75 Hz (5º par bordão in Natural is ~82.4 Hz, Sol2 is ~98 Hz)
  // Max frequency ~750 Hz (3º par requinta G#4 is ~415 Hz, overtone headroom ~750 Hz)
  const minPeriod = Math.floor(sampleRate / 750);
  const maxPeriod = Math.floor(sampleRate / 75);

  let bestOffset = -1;
  let bestCorrelation = 0;
  let lastCorrelation = 1;

  for (let offset = minPeriod; offset < maxPeriod; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxPeriod; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - (correlation / maxPeriod);

    // Peak detection with threshold
    if (correlation > 0.85 && correlation > lastCorrelation) {
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.85 && bestOffset !== -1) {
    // Parabolic interpolation around bestOffset for fractional bin precision
    let shift = 0;
    if (bestOffset > 0 && bestOffset < SIZE - 1) {
      const alpha = buffer[bestOffset - 1];
      const beta = buffer[bestOffset];
      const gamma = buffer[bestOffset + 1];
      const denom = 2 * (alpha - 2 * beta + gamma);
      if (denom !== 0) {
        shift = (alpha - gamma) / denom;
      }
    }

    const finePeriod = bestOffset + shift;
    const fundamentalFreq = sampleRate / finePeriod;

    if (fundamentalFreq >= 70 && fundamentalFreq <= 800) {
      return { detectedFreq: fundamentalFreq, rms };
    }
  }

  return { detectedFreq: -1, rms };
}
