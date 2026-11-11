import { useState, useEffect, useRef, useCallback } from 'react';
import { ViolaString, TuningPreset, TuningAction } from '../types/tuner';
import { getAudioContext } from '../audio/toneGenerator';
import { detectPitch } from '../audio/pitchDetector';
import { calculateCents } from '../constants/tunings';

interface UseAudioTunerProps {
  currentPreset: TuningPreset;
  selectedString: ViolaString;
  isAutoMode: boolean;
  noiseGateThreshold: number;
  a4BaseFreq: number;
  onAutoSelectString: (stringId: number) => void;
}

export function useAudioTuner({
  currentPreset,
  selectedString,
  isAutoMode,
  noiseGateThreshold,
  a4BaseFreq,
  onAutoSelectString,
}: UseAudioTunerProps) {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [dialAngle, setDialAngle] = useState<number>(0); // in degrees
  const [action, setAction] = useState<TuningAction>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Persistent Web Audio references
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Google Guitar Tuner Dynamics & Damping Engine
  const lastRmsRef = useRef<number>(0);
  const assessUntilTimeRef = useRef<number>(0);
  const realDialAngleRef = useRef<number>(0);
  const dialAngleRef = useRef<number>(0);
  const frequencyToRenderRef = useRef<number>(0);
  const smoothedCentsRef = useRef<number>(0);
  const silenceCountRef = useRef<number>(0);
  const freqHistoryRef = useRef<number[]>([]);

  // Synchronized refs for the animation loop
  const presetRef = useRef(currentPreset);
  const selectedStringRef = useRef(selectedString);
  const isAutoModeRef = useRef(isAutoMode);
  const noiseGateRef = useRef(noiseGateThreshold);
  const a4Ref = useRef(a4BaseFreq);
  const onAutoSelectRef = useRef(onAutoSelectString);

  useEffect(() => {
    presetRef.current = currentPreset;
  }, [currentPreset]);

  useEffect(() => {
    selectedStringRef.current = selectedString;
  }, [selectedString]);

  useEffect(() => {
    isAutoModeRef.current = isAutoMode;
  }, [isAutoMode]);

  useEffect(() => {
    noiseGateRef.current = noiseGateThreshold;
  }, [noiseGateThreshold]);

  useEffect(() => {
    a4Ref.current = a4BaseFreq;
  }, [a4BaseFreq]);

  useEffect(() => {
    onAutoSelectRef.current = onAutoSelectString;
  }, [onAutoSelectString]);

  // When changing selected string while idle, smoothly align dial to target note
  useEffect(() => {
    if (detectedFreq === null) {
      const a4 = a4BaseFreq || 440;
      const TAU = Math.PI * 2;
      const targetLinearized = Math.log2(selectedString.frequency / a4);
      const targetAngle = (targetLinearized * TAU - Math.PI * 0.5) % TAU;
      let angleDiff = (targetAngle - realDialAngleRef.current) % TAU;
      if (angleDiff > Math.PI) angleDiff -= TAU;
      if (angleDiff < -Math.PI) angleDiff += TAU;
      realDialAngleRef.current += angleDiff;
      dialAngleRef.current = realDialAngleRef.current;
      setDialAngle((dialAngleRef.current * 180) / Math.PI);
    }
  }, [selectedString.id, a4BaseFreq, detectedFreq]);

  const stopAudioLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      analyserRef.current = null;
    }

    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      silentGainRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsMicActive(false);
    setVolume(0);
    setAction('idle');
    setCents(0);
    setDetectedFreq(null);
    lastRmsRef.current = 0;
    assessUntilTimeRef.current = 0;
    silenceCountRef.current = 0;
    freqHistoryRef.current = [];
  }, []);

  /**
   * Google Guitar Tuner Core Algorithm adapted for Viola Caipira:
   * 1. Onset-Gated String Assessment: Only reassess target string when volume jumps (pluck onset).
   * 2. Shortest-path circular dial calculation with proportional damping (alpha = 0.15).
   * 3. Fluid frequency and cents tracking without frame-by-frame jitter.
   */
  const processFrame = useCallback((audioCtx: AudioContext, buffer: Float32Array<ArrayBuffer>) => {
    if (!analyserRef.current) return;

    analyserRef.current.getFloatTimeDomainData(buffer);
    const { detectedFreq: rawFreq, rms } = detectPitch(
      buffer,
      audioCtx.sampleRate,
      noiseGateRef.current
    );

    // Smooth volume meter
    const rawVol = Math.min(100, Math.round((rms / 0.06) * 100));
    setVolume(rawVol);

    const now = performance.now();
    const TAU = Math.PI * 2;
    const rmsOnsetThreshold = 0.005;

    // Google Onset Check: Only check for a new string if the volume goes up.
    // Otherwise assume that the string is the same as the last frame!
    if (rms > lastRmsRef.current + rmsOnsetThreshold && rawFreq > 0) {
      assessUntilTimeRef.current = now + 280; // 280ms assessment window on string attack
    }
    lastRmsRef.current = rms;

    if (rawFreq > 0) {
      silenceCountRef.current = 0;

      // Median filtering over 5 frames to eliminate any single-frame transient spikes
      freqHistoryRef.current.push(rawFreq);
      if (freqHistoryRef.current.length > 5) {
        freqHistoryRef.current.shift();
      }
      const sorted = [...freqHistoryRef.current].sort((a, b) => a - b);
      const stableFreq = sorted[Math.floor(sorted.length / 2)];

      let target = selectedStringRef.current;

      // Google Onset-Gated String Assessment (Modo Automático):
      // Only reassess which string is being tuned during the initial attack window.
      // While the note is sustaining/decaying, KEEP THE STRING LOCKED!
      if (isAutoModeRef.current) {
        if (now < assessUntilTimeRef.current) {
          const currentDiff = Math.abs(calculateCents(stableFreq, target.frequency));
          let minDiff = currentDiff;
          let bestString = target;

          for (const s of presetRef.current.strings) {
            const diff = Math.abs(calculateCents(stableFreq, s.frequency));
            // Only switch to a different string if it is significantly closer (> 18 cents closer)
            // This prevents jumping between strings sharing identical frequencies (e.g. 1º Par vs 4º Requinta)
            if (diff < minDiff - 18) {
              minDiff = diff;
              bestString = s;
            }
          }

          if (bestString && bestString.id !== selectedStringRef.current.id) {
            target = bestString;
            onAutoSelectRef.current(target.id);
          }
        }
      }

      // 1. Google Circular Clock Angle Calculation:
      // Convert frequency to linear semitones based on A4
      const a4 = a4Ref.current || 440;
      const linearizedFrequency = Math.log2(stableFreq / a4);
      // Align A to 12 o'clock (-PI / 2)
      const newDialAngle = (linearizedFrequency * TAU - Math.PI * 0.5) % TAU;

      // Shortest angular travel around the circle
      let angleDiff = (newDialAngle - realDialAngleRef.current) % TAU;
      if (angleDiff > Math.PI) angleDiff -= TAU;
      if (angleDiff < -Math.PI) angleDiff += TAU;

      realDialAngleRef.current = realDialAngleRef.current + angleDiff;

      // Google Needle Damping Equation:
      // dialAngle += (realDialAngle - dialAngle) * 0.15;
      dialAngleRef.current += (realDialAngleRef.current - dialAngleRef.current) * 0.15;

      // 2. Google Frequency and Cents Smoothing:
      if (frequencyToRenderRef.current === 0) {
        frequencyToRenderRef.current = stableFreq;
      } else {
        frequencyToRenderRef.current += (stableFreq - frequencyToRenderRef.current) * 0.15;
      }

      const rawCents = calculateCents(stableFreq, target.frequency);
      if (smoothedCentsRef.current === 0) {
        smoothedCentsRef.current = rawCents;
      } else {
        smoothedCentsRef.current += (rawCents - smoothedCentsRef.current) * 0.15;
      }

      const currentCents = smoothedCentsRef.current;
      setCents(currentCents);
      setDetectedFreq(frequencyToRenderRef.current);
      setDialAngle((dialAngleRef.current * 180) / Math.PI);

      // Status determination
      const absCents = Math.abs(currentCents);
      if (absCents <= 3.5) {
        setAction('in_tune');
      } else if (currentCents < 0) {
        setAction('too_low');
      } else {
        setAction('too_high');
      }
    } else {
      // Silence / signal dropped below noise gate
      silenceCountRef.current++;
      if (silenceCountRef.current > 10) {
        freqHistoryRef.current = [];
      }

      // Smooth decay back to zero after 300ms of silence
      if (silenceCountRef.current > 18) {
        smoothedCentsRef.current *= 0.92;
        if (Math.abs(smoothedCentsRef.current) < 0.2) {
          smoothedCentsRef.current = 0;
          setCents(0);
          setAction('idle');
          setDetectedFreq(null);
        } else {
          setCents(smoothedCentsRef.current);
        }

        // Smoothly guide the needle toward the nominal target string angle during silence
        const a4 = a4Ref.current || 440;
        const targetLinearized = Math.log2(selectedStringRef.current.frequency / a4);
        const targetAngle = (targetLinearized * TAU - Math.PI * 0.5) % TAU;
        let angleDiff = (targetAngle - realDialAngleRef.current) % TAU;
        if (angleDiff > Math.PI) angleDiff -= TAU;
        if (angleDiff < -Math.PI) angleDiff += TAU;
        realDialAngleRef.current += angleDiff * 0.08;
        dialAngleRef.current += (realDialAngleRef.current - dialAngleRef.current) * 0.12;
        setDialAngle((dialAngleRef.current * 180) / Math.PI);
      }
    }
  }, []);

  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      stopAudioLoop();
      return;
    }

    try {
      setMicError(null);
      const audioCtx = getAudioContext();

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      setIsMicActive(true);

      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        processFrame(audioCtx, buffer);
        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      console.error('Falha ao acessar microfone:', err);
      setIsMicActive(false);
      setMicError('Não foi possível acessar o microfone. Verifique se o microfone está liberado nas permissões do seu navegador.');
    }
  }, [isMicActive, stopAudioLoop, processFrame]);

  const playAudioFile = useCallback(async (file: File) => {
    try {
      stopAudioLoop();
      setMicError(null);
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      bufferSource.connect(analyser);
      analyser.connect(audioCtx.destination);

      setIsMicActive(true);

      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        processFrame(audioCtx, buffer);
        animFrameRef.current = requestAnimationFrame(loop);
      };

      bufferSource.onended = () => {
        setIsMicActive(false);
      };

      bufferSource.start();
      animFrameRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error('Erro ao processar áudio:', err);
      setMicError('Não foi possível decodificar o arquivo de áudio gravado.');
    }
  }, [stopAudioLoop, processFrame]);

  useEffect(() => {
    return () => {
      stopAudioLoop();
    };
  }, [stopAudioLoop]);

  return {
    isMicActive,
    detectedFreq,
    cents,
    dialAngle,
    action,
    volume,
    micError,
    toggleMic,
    playAudioFile,
    setCents,
    setDetectedFreq,
    setAction,
  };
}
