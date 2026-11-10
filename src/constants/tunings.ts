import { TuningPreset, ViolaString } from '../types/tuner';

export function calculateFrequency(semitonesFromA4: number, a4: number = 440): number {
  return a4 * Math.pow(2, semitonesFromA4 / 12);
}

export function calculateCents(detectedFreq: number, targetFreq: number): number {
  return 1200 * Math.log2(detectedFreq / targetFreq);
}

interface RawStringDef {
  id: number;
  pair: number;
  type: 'uníssono' | 'requinta' | 'bordão';
  note: string;
  octave: number;
  semitonesFromA4: number;
  label: string;
}

const RAW_TUNINGS: Record<string, { name: string; description: string; rootNote: string; strings: RawStringDef[] }> = {
  cebolao_mi: {
    name: "Cebolão em Mi",
    description: "Afinação mais tradicional da viola caipira. Aberta em Mi maior.",
    rootNote: "E",
    strings: [
      { id: 0, pair: 1, type: "uníssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1º Par (A)" },
      { id: 1, pair: 1, type: "uníssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1º Par (B)" },
      { id: 2, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (A)" },
      { id: 3, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G#", octave: 4, semitonesFromA4: -1, label: "3º Requinta" },
      { id: 5, pair: 3, type: "bordão", note: "G#", octave: 3, semitonesFromA4: -13, label: "3º Bordão" },
      { id: 6, pair: 4, type: "requinta", note: "E", octave: 4, semitonesFromA4: -5, label: "4º Requinta" },
      { id: 7, pair: 4, type: "bordão", note: "E", octave: 3, semitonesFromA4: -17, label: "4º Bordão" },
      { id: 8, pair: 5, type: "requinta", note: "B", octave: 3, semitonesFromA4: -10, label: "5º Requinta" },
      { id: 9, pair: 5, type: "bordão", note: "B", octave: 2, semitonesFromA4: -22, label: "5º Bordão" },
    ]
  },
  cebolao_re: {
    name: "Cebolão em Ré",
    description: "Um tom abaixo do Cebolão em Mi. Tensão mais suave e som aveludado.",
    rootNote: "D",
    strings: [
      { id: 0, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (A)" },
      { id: 1, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (B)" },
      { id: 2, pair: 2, type: "uníssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2º Par (A)" },
      { id: 3, pair: 2, type: "uníssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2º Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "F#", octave: 4, semitonesFromA4: -3, label: "3º Requinta" },
      { id: 5, pair: 3, type: "bordão", note: "F#", octave: 3, semitonesFromA4: -15, label: "3º Bordão" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4º Requinta" },
      { id: 7, pair: 4, type: "bordão", note: "D", octave: 3, semitonesFromA4: -19, label: "4º Bordão" },
      { id: 8, pair: 5, type: "requinta", note: "A", octave: 3, semitonesFromA4: -12, label: "5º Requinta" },
      { id: 9, pair: 5, type: "bordão", note: "A", octave: 2, semitonesFromA4: -24, label: "5º Bordão" },
    ]
  },
  rio_abaixo: {
    name: "Rio Abaixo",
    description: "Afinação misteriosa em Sol maior, lendária no folclore brasileiro.",
    rootNote: "G",
    strings: [
      { id: 0, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (A)" },
      { id: 1, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (B)" },
      { id: 2, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (A)" },
      { id: 3, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G", octave: 4, semitonesFromA4: -2, label: "3º Requinta" },
      { id: 5, pair: 3, type: "bordão", note: "G", octave: 3, semitonesFromA4: -14, label: "3º Bordão" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4º Requinta" },
      { id: 7, pair: 4, type: "bordão", note: "D", octave: 3, semitonesFromA4: -19, label: "4º Bordão" },
      { id: 8, pair: 5, type: "requinta", note: "G", octave: 3, semitonesFromA4: -14, label: "5º Requinta" },
      { id: 9, pair: 5, type: "bordão", note: "G", octave: 2, semitonesFromA4: -26, label: "5º Bordão" },
    ]
  },
  boiadeira: {
    name: "Boiadeira",
    description: "Muito utilizada no pantanal e sertão com sonoridade marcante.",
    rootNote: "G/D",
    strings: [
      { id: 0, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (A)" },
      { id: 1, pair: 1, type: "uníssono", note: "D", octave: 4, semitonesFromA4: -7, label: "1º Par (B)" },
      { id: 2, pair: 2, type: "uníssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2º Par (A)" },
      { id: 3, pair: 2, type: "uníssono", note: "A", octave: 3, semitonesFromA4: -12, label: "2º Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "F#", octave: 4, semitonesFromA4: -3, label: "3º Requinta" },
      { id: 5, pair: 3, type: "bordão", note: "F#", octave: 3, semitonesFromA4: -15, label: "3º Bordão" },
      { id: 6, pair: 4, type: "requinta", note: "D", octave: 4, semitonesFromA4: -7, label: "4º Requinta" },
      { id: 7, pair: 4, type: "bordão", note: "D", octave: 3, semitonesFromA4: -19, label: "4º Bordão" },
      { id: 8, pair: 5, type: "requinta", note: "G", octave: 3, semitonesFromA4: -14, label: "5º Requinta" },
      { id: 9, pair: 5, type: "bordão", note: "G", octave: 2, semitonesFromA4: -26, label: "5º Bordão" },
    ]
  },
  natural: {
    name: "Natural / Maior",
    description: "Afinação com o 5º par oitavado em Mi (Grave Mi2).",
    rootNote: "E",
    strings: [
      { id: 0, pair: 1, type: "uníssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1º Par (A)" },
      { id: 1, pair: 1, type: "uníssono", note: "E", octave: 4, semitonesFromA4: -5, label: "1º Par (B)" },
      { id: 2, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (A)" },
      { id: 3, pair: 2, type: "uníssono", note: "B", octave: 3, semitonesFromA4: -10, label: "2º Par (B)" },
      { id: 4, pair: 3, type: "requinta", note: "G#", octave: 4, semitonesFromA4: -1, label: "3º Requinta" },
      { id: 5, pair: 3, type: "bordão", note: "G#", octave: 3, semitonesFromA4: -13, label: "3º Bordão" },
      { id: 6, pair: 4, type: "requinta", note: "E", octave: 4, semitonesFromA4: -5, label: "4º Requinta" },
      { id: 7, pair: 4, type: "bordão", note: "E", octave: 3, semitonesFromA4: -17, label: "4º Bordão" },
      { id: 8, pair: 5, type: "requinta", note: "E", octave: 3, semitonesFromA4: -17, label: "5º Requinta" },
      { id: 9, pair: 5, type: "bordão", note: "E", octave: 2, semitonesFromA4: -29, label: "5º Bordão" },
    ]
  }
};

export function getTuningPresets(a4: number = 440): Record<string, TuningPreset> {
  const result: Record<string, TuningPreset> = {};

  for (const [key, raw] of Object.entries(RAW_TUNINGS)) {
    const strings: ViolaString[] = raw.strings.map((str) => ({
      ...str,
      frequency: calculateFrequency(str.semitonesFromA4, a4)
    }));

    result[key] = {
      key,
      name: raw.name,
      description: raw.description,
      rootNote: raw.rootNote,
      strings
    };
  }

  return result;
}
