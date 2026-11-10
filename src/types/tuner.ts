export type StringType = 'uníssono' | 'requinta' | 'bordão';

export interface ViolaString {
  id: number;
  pair: number; // 1 to 5
  type: StringType;
  note: string;
  octave: number;
  semitonesFromA4: number;
  label: string;
  frequency: number; // calculated according to A4 base
}

export interface TuningPreset {
  key: string;
  name: string;
  description: string;
  rootNote: string;
  strings: ViolaString[];
}

export type TuningAction = 'in_tune' | 'too_low' | 'too_high' | 'idle';

export interface PitchDetectionResult {
  detectedFreq: number;
  rms: number;
}

export interface TunerState {
  currentTuningKey: string;
  a4BaseFreq: number;
  noiseGateThreshold: number; // 0 to 1
  isAutoMode: boolean;
  selectedStringId: number;
  isMicActive: boolean;
  detectedFreq: number | null;
  cents: number;
  action: TuningAction;
  volume: number; // 0 to 100
}
