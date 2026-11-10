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

  // Persistent Web Audio references to prevent GC and clocking issues
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

      // Request microphone access with safe fallback
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
        // Fallback for devices/browsers that reject specific constraints
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Ensure audio context is running
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      streamRef.current = stream;

      // Create nodes and hold persistent references to avoid Garbage Collection
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // Connect to a 0-gain node and destination:
      // This forces Chrome and Safari to pull and clock the audio stream without playing feedback
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      setIsMicActive(true);

      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(buffer);
        const { detectedFreq: freq, rms } = detectPitch(
          buffer,
          audioCtx.sampleRate,
          noiseGateRef.current
        );

        // Volume meter: scaled smoothly between 0% and 100%
        const volPercent = Math.min(100, Math.round((rms / 0.06) * 100));
        setVolume(volPercent);

        if (freq > 0) {
          setDetectedFreq(freq);
          let target = selectedStringRef.current;

          if (isAutoModeRef.current) {
            // Find string with minimal cents deviation
            let minDiff = Infinity;
            let bestString = target;

            for (const s of presetRef.current.strings) {
              const diff = Math.abs(calculateCents(freq, s.frequency));
              if (diff < minDiff) {
                minDiff = diff;
                bestString = s;
              }
            }

            if (bestString.id !== selectedStringRef.current.id) {
              onAutoSelectRef.current(bestString.id);
            }
            target = bestString;
          }

          const c = calculateCents(freq, target.frequency);
          setCents(c);

          const absCents = Math.abs(c);
          if (absCents <= 3.5) {
            setAction('in_tune');
          } else if (c < 0) {
            setAction('too_low');
          } else {
            setAction('too_high');
          }
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      console.error('Falha ao acessar microfone:', err);
      setIsMicActive(false);
      setMicError('Não foi possível acessar o microfone. Verifique se o microfone está liberado nas permissões do seu navegador.');
    }
  }, [isMicActive, stopAudioLoop]);

  // Cleanup on unmount
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
    setCents,
    setDetectedFreq,
    setAction,
  };
}
