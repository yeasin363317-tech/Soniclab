import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Play, Square } from 'lucide-react';
import { getAC } from '../useMic';
import { Card, PageTitle } from '../ui';

const WAVES: OscillatorType[] = ['sine', 'square', 'triangle', 'sawtooth'];
const PRESETS: [string, number][] = [['Sub bass', 40], ['Mains hum', 60], ['A4 (440)', 440], ['1 kHz', 1000], ['8 kHz', 8000], ['15 kHz', 15000]];
const MIN = 20;
const gainOf = (v: number) => Math.pow(v / 100, 2) * 0.5; // conservative curve

export default function Generator() {
  const ctxRef = useRef<AudioContext | null>(null);
  const osc = useRef<OscillatorNode | null>(null);
  const gain = useRef<GainNode | null>(null);
  const [sr, setSr] = useState(0);
  const [freq, setFreq] = useState(440);
  const [text, setText] = useState('440');
  const [wave, setWave] = useState<OscillatorType>('sine');
  const [vol, setVol] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState('');
  const supported = !!getAC();
  const max = sr ? Math.min(20000, Math.floor(sr / 2)) : 20000;

  useEffect(() => {
    const AC = getAC();
    if (!AC) return;
    const c = new AC();
    ctxRef.current = c;
    setSr(c.sampleRate);
    return () => { try { osc.current?.stop(); } catch { /* already stopped */ } osc.current = null; c.close().catch(() => {}); ctxRef.current = null; };
  }, []);

  const apply = (f: number) => {
    setFreq(f); setText(String(f)); setErr('');
    const c = ctxRef.current;
    if (osc.current && c) osc.current.frequency.setTargetAtTime(f, c.currentTime, 0.02);
  };

  const onText = (v: string) => {
    setText(v);
    const f = Number(v);
    if (v.trim() === '' || !Number.isFinite(f)) return setErr('Enter a number in Hz.');
    if (f < MIN || f > max)
      return setErr(`Frequency must be between ${MIN} and ${max} Hz (sample rate ${sr} Hz, Nyquist ${sr / 2} Hz).`);
    setErr(''); setFreq(f);
    const c = ctxRef.current;
    if (osc.current && c) osc.current.frequency.setTargetAtTime(f, c.currentTime, 0.02);
  };

  const play = async () => {
    const c = ctxRef.current;
    if (!c || err || playing) return;
    try { await c.resume(); } catch { return setErr('Could not start audio output.'); }
    const o = c.createOscillator(), g = c.createGain();
    o.type = wave; o.frequency.value = freq; g.gain.value = 0;
    o.connect(g).connect(c.destination); o.start();
    g.gain.setTargetAtTime(gainOf(vol), c.currentTime, 0.02);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    osc.current = o; gain.current = g; setPlaying(true);
  };

  const stop = () => {
    const c = ctxRef.current, o = osc.current, g = gain.current;
    if (c && o && g) { g.gain.setTargetAtTime(0, c.currentTime, 0.015); o.stop(c.currentTime + 0.1); }
    osc.current = null; gain.current = null; setPlaying(false);
  };

  const sliderVal = Math.round((Math.log(Math.min(Math.max(freq, MIN), max) / MIN) / Math.log(max / MIN)) * 1000);

  if (!supported)
    return (<><PageTitle title="Sound Generator" text="Generate tones with the Web Audio API." />
      <Card><p role="alert" className="text-red-200">This browser does not support the Web Audio API.</p></Card></>);

  return (
    <>
      <PageTitle title="Sound Generator" text="Generate pure tones with the Web Audio API. Nothing plays until you press Play." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="space-y-6 lg:col-span-3">
          <div>
            <label htmlFor="hz" className="label">Frequency (Hz)</label>
            <div className="mt-2 flex items-center gap-3">
              <input id="hz" inputMode="decimal" value={text} onChange={(e) => onText(e.target.value)} onBlur={() => err && apply(freq)}
                aria-invalid={!!err} aria-describedby="hz-err"
                className="w-36 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-2xl tabular-nums outline-none focus:ring-2 focus:ring-indigo-400" />
              <span className="text-white/50">Hz</span>
            </div>
            <p id="hz-err" role="alert" className="mt-2 min-h-[1.25rem] text-sm text-red-300">{err}</p>
            <input type="range" aria-label="Frequency slider" min={0} max={1000} value={sliderVal}
              onChange={(e) => apply(Math.round(MIN * Math.pow(max / MIN, Number(e.target.value) / 1000) * 10) / 10)} className="mt-2" />
            <div className="mt-1 flex justify-between text-[11px] text-white/40"><span>{MIN} Hz</span><span>{max >= 1000 ? `${max / 1000} kHz` : `${max} Hz`}</span></div>
          </div>

          <div>
            <p className="label">Waveform</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Waveform">
              {WAVES.map((w) => (
                <button key={w} role="radio" aria-checked={wave === w}
                  onClick={() => { setWave(w); if (osc.current) osc.current.type = w; }}
                  className={`btn capitalize ${wave === w ? 'bg-indigo-500/25 ring-1 ring-indigo-400' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}>{w}</button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="vol" className="label flex justify-between"><span>Volume</span><span>{vol}%</span></label>
            <input id="vol" type="range" min={0} max={100} value={vol} className="mt-2"
              onChange={(e) => { const v = Number(e.target.value); setVol(v); const c = ctxRef.current; if (gain.current && c) gain.current.gain.setTargetAtTime(gainOf(v), c.currentTime, 0.02); }} />
          </div>

          <div className="flex gap-3">
            <button className="btn-primary flex-1 sm:flex-none" onClick={play} disabled={playing || !!err || !sr}><Play className="h-4 w-4" /> Play</button>
            <button className="btn-ghost flex-1 sm:flex-none" onClick={stop} disabled={!playing}><Square className="h-4 w-4" /> Stop</button>
            {playing && <span className="flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Playing {freq} Hz</span>}
          </div>
        </Card>

        <Card className="space-y-4 lg:col-span-2">
          <p className="label">Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.filter(([, f]) => f <= max).map(([n, f]) => (
              <button key={n} onClick={() => apply(f)} className={`btn flex-col !gap-0 !py-2.5 border border-white/10 ${freq === f ? 'bg-indigo-500/25 ring-1 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}>
                <span>{n}</span><span className="text-xs text-white/50">{f} Hz</span>
              </button>
            ))}
          </div>
          <p className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Start quiet and raise the volume slowly, especially with headphones. Very high or low tones can be uncomfortable and may damage hearing or speakers at high levels.
          </p>
          <p className="text-xs text-white/40">Output sample rate: {sr ? `${sr} Hz` : '…'}</p>
        </Card>
      </div>
    </>
  );
}
