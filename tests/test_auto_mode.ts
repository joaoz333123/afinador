import { getTuningPresets, calculateCents } from '../src/constants/tunings';

const presets = getTuningPresets(440);

for (const [key, preset] of Object.entries(presets)) {
  console.log(`\n================ ${preset.name} ================`);
  // Group strings by frequency
  const freqMap = new Map<number, string[]>();
  for (const s of preset.strings) {
    const f = Math.round(s.frequency * 100) / 100;
    const list = freqMap.get(f) || [];
    list.push(`Corda ${s.id} (${s.label} - ${s.note}${s.octave})`);
    freqMap.set(f, list);
  }

  for (const [f, strings] of freqMap.entries()) {
    if (strings.length > 1) {
      console.log(`Frequência compartilhada: ${f} Hz:`);
      strings.forEach(str => console.log(`   - ${str}`));
    }
  }

  // Simulate auto-selection for each string's exact frequency
  console.log('\nSimulação do Auto-Mode (qual corda é selecionada para cada frequência):');
  for (const targetString of preset.strings) {
    let minDiff = Infinity;
    let bestString = targetString;
    for (const s of preset.strings) {
      const diff = Math.abs(calculateCents(targetString.frequency, s.frequency));
      if (diff < minDiff) {
        minDiff = diff;
        bestString = s;
      }
    }
    const isSelf = bestString.id === targetString.id;
    console.log(`  Tocando Corda ${targetString.id} (${targetString.label} ${targetString.note}${targetString.octave}) -> Auto-selecionou: Corda ${bestString.id} (${bestString.label}) [${isSelf ? 'OK' : 'INCORRETO/SOBREPOSTO'}]`);
  }
}
