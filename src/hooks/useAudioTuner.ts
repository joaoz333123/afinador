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
  onAutoSelectString: (stringId: number) => void;
}

export function useAudioTuner({
  currentPreset,
  selectedString,
  isAutoMode,
  noiseGateThreshold,
  onAutoSelectString,
}: UseAudioTunerProps) {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [action, setAction] = useState<TuningAction>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Persistent Web Audio references
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smoothing and stabilization dynamics
  const smoothedCentsRef = useRef<number>(0);
  const smoothedFreqRef = useRef<number>(0);
  const freqHistoryRef = useRef<number[]>([]);
  const candidateSwitchRef = useRef<{ id: number; count: number } | null>(null);
  const silenceCountRef = useRef<number>(0);

  // Synchronized refs for the animation loop
  const presetRef = useRef(currentPreset);
  const selectedStringRef = useRef(selectedString);
  const isAutoModeRef = useRef(isAutoMode);
  const noiseGateRef = useRef(noiseGateThreshold);
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
    onAutoSelectRef.current = onAutoSelectString;
  }, [onAutoSelectString]);

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
    smoothedCentsRef.current = 0;
    smoothedFreqRef.current = 0;
    freqHistoryRef.current = [];
    candidateSwitchRef.current = null;
    silenceCountRef.current = 0;
  }, []);

  // Core processing loop with Median Filtering + Exponential Moving Average (EMA)
  const processFrame = useCallback((audioCtx: AudioContext, buffer: Float32Array<ArrayBuffer>) => {
    if (!analyserRef.current) return;

    analyserRef.current.getFloatTimeDomainData(buffer);
    const { detectedFreq: rawFreq, rms } = detectPitch(
      buffer,
      audioCtx.sampleRate,
      noiseGateRef.current
    );

    // Smooth volume meter: scaled smoothly between 0% and 100%
    const rawVol = Math.min(100, Math.round((rms / 0.06) * 100));
    setVolume(rawVol);

    if (rawFreq > 0) {
      silenceCountRef.current = 0;

      // 1. Median filtering over last 5 detected frequencies to eliminate transient pick spikes
      freqHistoryRef.current.push(rawFreq);
      if (freqHistoryRef.current.length > 5) {
        freqHistoryRef.current.shift();
      }
      const sorted = [...freqHistoryRef.current].sort((a, b) => a - b);
      const stableFreq = sorted[Math.floor(sorted.length / 2)];

      // 2. Identify target string (with hysteresis & debounce)
      let target = selectedStringRef.current;

      if (isAutoModeRef.current) {
        const currentString = selectedStringRef.current;
        const currentCentsDiff = Math.abs(calculateCents(stableFreq, currentString.frequency));

        if (currentCentsDiff <= 50) {
          // Keep current string if within ±50 cents
          candidateSwitchRef.current = null;
          target = currentString;
        } else {
          // Check partner string in the same pair first
          const samePairStrings = presetRef.current.strings.filter(
            (s) => s.pair === currentString.pair && s.id !== currentString.id
          );
          let candidateString: ViolaString | null = null;
          let minDiff = Infinity;

          for (const partner of samePairStrings) {
            const diff = Math.abs(calculateCents(stableFreq, partner.frequency));
            if (diff <= 50 && diff < minDiff) {
              minDiff = diff;
              candidateString = partner;
            }
          }

          // If not in same pair, search closest string across entire instrument
          if (!candidateString) {
            for (const s of presetRef.current.strings) {
              const diff = Math.abs(calculateCents(stableFreq, s.frequency));
              if (diff < minDiff) {
                minDiff = diff;
                candidateString = s;
              }
            }
          }

          if (candidateString && candidateString.id !== currentString.id) {
            // Debounce: candidate string must persist for at least 3 consecutive frames
            if (candidateSwitchRef.current?.id === candidateString.id) {
              candidateSwitchRef.current.count++;
              if (candidateSwitchRef.current.count >= 3) {
                target = candidateString;
                onAutoSelectRef.current(target.id);
                candidateSwitchRef.current = null;
              }
            } else {
              candidateSwitchRef.current = { id: candidateString.id, count: 1 };
            }
          }
        }
      }

      // 3. Smooth Exponential Moving Average (EMA) for the needle and cents
      const rawCents = calculateCents(stableFreq, target.frequency);
      const alpha = 0.16; // fluid analog needle inertia (~120ms settling time)

      if (smoothedFreqRef.current === 0) {
        smoothedCentsRef.current = rawCents;
        smoothedFreqRef.current = stableFreq;
      } else {
        smoothedCentsRef.current = smoothedCentsRef.current * (1 - alpha) + rawCents * alpha;
        smoothedFreqRef.current = smoothedFreqRef.current * (1 - alpha) + stableFreq * alpha;
      }

      const currentSmoothedCents = smoothedCentsRef.current;
      setCents(currentSmoothedCents);
      setDetectedFreq(smoothedFreqRef.current);

      const absCents = Math.abs(currentSmoothedCents);
      if (absCents <= 3.5) {
        setAction('in_tune');
      } else if (currentSmoothedCents < 0) {
        setAction('too_low');
      } else {
        setAction('too_high');
      }
    } else {
      // Silence / signal dropped below noise gate
      silenceCountRef.current++;
      freqHistoryRef.current = [];
      candidateSwitchRef.current = null;

      // Hold reading for ~300ms (18 frames @ 60fps), then gently drift back to center
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
