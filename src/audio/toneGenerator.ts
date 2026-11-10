let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Plays an acoustic-like synthesized reference tone for the string.
 * Uses a fundamental sine wave plus a soft 2nd harmonic and gentle ADSR envelope.
 */
export function playReferenceTone(frequency: number, duration: number = 2.0): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const masterGain = ctx.createGain();

    // Fundamental tone
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    gain1.gain.setValueAtTime(0.7, now);

    // Warm second harmonic for acoustic instrument body
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    gain2.gain.setValueAtTime(0.2, now);

    // ADSR Envelope
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.4, now + 0.05); // Attack
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Decay

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  } catch (err) {
    console.error('Erro ao tocar som de referência:', err);
  }
}
