import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useMic } from '../useMic';
import Canvas from '../Canvas';
import { Card, MicControls, PageTitle } from '../ui';

const FLOOR = -100;
const fmt = (v: number | null) => (v === null ? '—' : v <= FLOOR ? '−∞' : v.toFixed(1));

export default function Meter() {
  const { status, error, analyser, start, stop } = useMic();
  const [db, setDb] = useState<number | null>(null);
  const [peak, setPeak] = useState<number | null>(null);
  const buf = useRef<Float32Array | null>(null);
  const peakRef = useRef(FLOOR);
  const last = useRef(0);

  useEffect(() => { peakRef.current = FLOOR; setDb(null); setPeak(null); }, [analyser]);

  const draw = (c: CanvasRenderingContext2D, w: number, h: number) => {
    c.strokeStyle = 'rgba(255,255,255,.08)';
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
    if (!analyser) return;
    if (!buf.current || buf.current.length !== analyser.fftSize) buf.current = new Float32Array(analyser.fftSize);
    const d = buf.current;
    analyser.getFloatTimeDomainData(d);
    let sum = 0;
    for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
    const rms = Math.sqrt(sum / d.length);
    const level = Math.max(20 * Math.log10(Math.max(rms, 1e-5)), FLOOR);
    peakRef.current = Math.max(peakRef.current, level);
    const now = performance.now();
    if (now - last.current > 80) { last.current = now; setDb(level); setPeak(peakRef.current); }

    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#a78bfa');
    c.strokeStyle = g; c.lineWidth = 2; c.beginPath();
    const step = Math.max(1, Math.floor(d.length / w));
    for (let x = 0; x < w; x++) {
      const v = Math.max(-1, Math.min(1, d[x * step] * 3)); // 3x visual zoom
      const y = h / 2 - v * (h / 2 - 4);
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  };

  const pct = db === null ? 0 : ((Math.max(db, -90) + 90) / 90) * 100;
  const active = status === 'active';

  return (
    <>
      <PageTitle title="Sound Meter" text="Live microphone level as RMS in dBFS, with a real-time waveform." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="label">Level (RMS)</p>
          <p className="mt-2 text-6xl font-semibold tabular-nums" aria-live="off">{fmt(db)}</p>
          <p className="text-sm text-white/50">dBFS</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10" role="meter" aria-label="Sound level" aria-valuemin={-90} aria-valuemax={0} aria-valuenow={db ?? -90}>
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-[width] duration-75" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-white/40"><span>−90</span><span>−60</span><span>−30</span><span>0</span></div>
          <div className="mt-5 flex items-center justify-between">
            <div><p className="label">Peak hold</p><p className="text-xl tabular-nums">{fmt(peak)} <span className="text-xs text-white/50">dBFS</span></p></div>
            <button className="btn-ghost !px-3 !py-2" onClick={() => { peakRef.current = FLOOR; setPeak(active ? FLOOR : null); }} disabled={!active} aria-label="Reset peak">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </Card>
        <Card className="space-y-4 lg:col-span-2">
          <p className="label">Waveform</p>
          <Canvas draw={draw} label="Live microphone waveform" />
          {!active && status !== 'error' && <p className="text-sm text-white/50">Press Start to begin. Your browser will ask for microphone access.</p>}
          {active && <p className="flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Listening</p>}
          <MicControls status={status} error={error} start={start} stop={stop} />
        </Card>
      </div>
      <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/55">
        <strong className="text-white/80">dBFS is not dB SPL.</strong> dBFS is a digital level relative to full scale (0 dBFS is the loudest value the signal can hold). dB SPL is real acoustic pressure and needs a calibrated microphone and reference meter. These readings cannot be used as certified loudness or safety measurements. Waveform is drawn at 3× zoom.
      </p>
    </>
  );
}
