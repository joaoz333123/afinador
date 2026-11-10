import { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getTuningPresets } from './constants/tunings';
import { playReferenceTone } from './audio/toneGenerator';
import { useAudioTuner } from './hooks/useAudioTuner';
import { Header } from './components/Header';
import { TunerMeter } from './components/TunerMeter';
import { ViolaHeadstock } from './components/ViolaHeadstock';
import { StringPairList } from './components/StringPairList';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles } from 'lucide-react';

export function App() {
  const [currentTuningKey, setCurrentTuningKey] = useState<string>('cebolao_mi');
  const [a4BaseFreq, setA4BaseFreq] = useState<number>(440);
  const [noiseGateThreshold, setNoiseGateThreshold] = useState<number>(0.15);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [selectedStringId, setSelectedStringId] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Recalculate presets whenever A4 calibration changes
  const presets = useMemo(() => getTuningPresets(a4BaseFreq), [a4BaseFreq]);
  const currentPreset = presets[currentTuningKey] || presets['cebolao_mi'];

  const selectedString = useMemo(() => {
    return currentPreset.strings.find((s) => s.id === selectedStringId) || currentPreset.strings[0];
  }, [currentPreset, selectedStringId]);

  const {
    isMicActive,
    detectedFreq,
    cents,
    action,
    volume,
    micError,
    toggleMic,
    setCents,
    setDetectedFreq,
    setAction
  } = useAudioTuner({
    currentPreset,
    selectedString,
    isAutoMode,
    noiseGateThreshold,
    onAutoSelectString: (id) => setSelectedStringId(id),
  });

  // Track in-tune duration to trigger confetti celebration
  const inTuneTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (action === 'in_tune' && isMicActive) {
      if (!inTuneTimerRef.current) {
        inTuneTimerRef.current = window.setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#22c55e', '#f59e0b', '#38bdf8']
          });
        }, 800);
      }
    } else {
      if (inTuneTimerRef.current) {
        clearTimeout(inTuneTimerRef.current);
        inTuneTimerRef.current = null;
      }
    }
    return () => {
      if (inTuneTimerRef.current) {
        clearTimeout(inTuneTimerRef.current);
      }
    };
  }, [action, isMicActive]);

  const handlePlayString = (str = selectedString) => {
    playReferenceTone(str.frequency);
    setSelectedStringId(str.id);
    if (isMicActive) {
      // Visual feedback on needle only when microphone is active
      setCents(0);
      setDetectedFreq(str.frequency);
      setAction('in_tune');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between p-3 md:p-6">
      
      {/* Container */}
      <div className="w-full max-w-5xl flex flex-col flex-1">
        
        {/* Header */}
        <Header
          presets={presets}
          currentTuningKey={currentTuningKey}
          a4BaseFreq={a4BaseFreq}
          onTuningChange={(key) => {
            setCurrentTuningKey(key);
            setSelectedStringId(0);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          
          {/* Left / Top: Tuner Meter & Quick Actions */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <TunerMeter
              selectedString={selectedString}
              isMicActive={isMicActive}
              detectedFreq={detectedFreq}
              cents={cents}
              action={action}
              volume={volume}
              noiseGateThreshold={noiseGateThreshold}
              isAutoMode={isAutoMode}
              micError={micError}
              onToggleMic={toggleMic}
              onPlayReference={() => handlePlayString(selectedString)}
              onToggleMode={(auto) => setIsAutoMode(auto)}
            />

            {/* Quick Test bar */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Atalho dos 5 Pares (Toque para ouvir & selecionar)
                </span>
                <span className="text-[10px] text-neutral-400">
                  {currentPreset.name}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((pairNum) => {
                  const pairStrings = currentPreset.strings.filter((s) => s.pair === pairNum);
                  const isUnison = pairStrings[0].type === 'uníssono';

                  if (isUnison) {
                    const isSelected = pairStrings.some((s) => s.id === selectedStringId);
                    return (
                      <div
                        key={pairNum}
                        className={`rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between transition ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                            : 'bg-black/30 border-white/5'
                        }`}
                      >
                        <div className="text-[10px] text-neutral-400 text-center font-semibold mb-1">
                          {pairNum}º Par
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStringId(pairStrings[0].id);
                            handlePlayString(pairStrings[0]);
                          }}
                          className={`w-full py-1.5 px-0.5 rounded-lg border text-center transition flex flex-col items-center justify-center active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold shadow'
                              : 'bg-white/5 border-transparent text-neutral-300 hover:border-amber-500/40 hover:bg-white/10'
                          }`}
                          title={`${pairNum}º Par Uníssono (${pairStrings[0].note}${pairStrings[0].octave} - ${pairStrings[0].frequency.toFixed(1)} Hz)`}
                        >
                          <div className="text-xs sm:text-sm font-black text-white">
                            {pairStrings[0].note}{pairStrings[0].octave}
                          </div>
                          <div className="text-[9px] text-amber-400/80 font-medium">
                            Uníssono
                          </div>
                        </button>
                      </div>
                    );
                  }

                  const requinta = pairStrings.find((s) => s.type === 'requinta') || pairStrings[0];
                  const bordao = pairStrings.find((s) => s.type === 'bordão') || pairStrings[1];
                  const isPairActive = pairStrings.some((s) => s.id === selectedStringId);

                  return (
                    <div
                      key={pairNum}
                      className={`rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between transition ${
                        isPairActive
                          ? 'bg-neutral-800/60 border-neutral-700 shadow-md'
                          : 'bg-black/30 border-white/5'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-400 text-center font-semibold mb-1">
                        {pairNum}º Par
                      </div>
                      <div className="grid grid-cols-2 gap-1 w-full">
                        <button
                          onClick={() => {
                            setSelectedStringId(requinta.id);
                            handlePlayString(requinta);
                          }}
                          className={`py-1 px-0.5 rounded-lg border text-center transition flex flex-col items-center justify-center active:scale-95 ${
                            selectedStringId === requinta.id
                              ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold shadow'
                              : 'bg-white/5 border-transparent text-neutral-300 hover:border-sky-400/50 hover:bg-white/10'
                          }`}
                          title={`Requinta: ${requinta.note}${requinta.octave} (${requinta.frequency.toFixed(1)} Hz)`}
                        >
                          <div className="text-[11px] sm:text-xs font-black text-white leading-tight">
                            {requinta.note}{requinta.octave}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-sky-400 font-bold uppercase">
                            Req (R)
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStringId(bordao.id);
                            handlePlayString(bordao);
                          }}
                          className={`py-1 px-0.5 rounded-lg border text-center transition flex flex-col items-center justify-center active:scale-95 ${
                            selectedStringId === bordao.id
                              ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold shadow'
                              : 'bg-white/5 border-transparent text-neutral-300 hover:border-purple-400/50 hover:bg-white/10'
                          }`}
                          title={`Bordão: ${bordao.note}${bordao.octave} (${bordao.frequency.toFixed(1)} Hz)`}
                        >
                          <div className="text-[11px] sm:text-xs font-black text-white leading-tight">
                            {bordao.note}{bordao.octave}
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-purple-400 font-bold uppercase">
                            Bor (B)
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Viola Headstock & Strings List */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <ViolaHeadstock
              strings={currentPreset.strings}
              selectedStringId={selectedStringId}
              onSelectString={(id) => {
                setSelectedStringId(id);
                setIsAutoMode(false); // switch to manual when user explicitly selects a string
              }}
            />

            <StringPairList
              strings={currentPreset.strings}
              selectedStringId={selectedStringId}
              onSelectString={(id) => {
                setSelectedStringId(id);
                setIsAutoMode(false);
              }}
              onPlayStringTone={handlePlayString}
            />
          </div>

        </main>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl pt-4 mt-6 border-t border-white/10 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Afinador de Viola Caipira • 10 Cordas • Latência Zero no Navegador</span>
        <span>A4 = {a4BaseFreq} Hz • Suporta Cebolão, Rio Abaixo, Boiadeira e Natural</span>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        a4BaseFreq={a4BaseFreq}
        noiseGateThreshold={noiseGateThreshold}
        onClose={() => setIsSettingsOpen(false)}
        onA4Change={(freq) => setA4BaseFreq(freq)}
        onNoiseGateChange={(gate) => setNoiseGateThreshold(gate)}
      />

    </div>
  );
}
export default App;
