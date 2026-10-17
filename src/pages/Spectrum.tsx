import { useEffect, useRef, useState } from 'react';
import { useMic } from '../useMic';
import Canvas from '../Canvas';
import { Card, MicControls, PageTitle } from '../ui';

const LABELS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const lab = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

export default function Spectrum() {
  const { status, error, analyser, start, stop } = useMic();
  const [peak, setPeak] = useState<number | null>(null);
  const buf = useRef<Float32Array | null>(null);
  const last = useRef(0);
  useEffect(() => setPeak(null), [analyser]);

  const draw = (c: CanvasRenderingContext2D, w: number, h: number) => {
    const nyq = analyser ? analyser.context.sampleRate / 2 : 22050;
    const fmin = 20, fmax = Math.min(20000, nyq), plotH = h - 18;
    const X = (f: number) => (Math.log(f / fmin) / Math.log(fmax / fmin)) * w;
    c.font = '10px Inter, sans-serif'; c.textAlign = 'center';
    for (const f of LABELS) {
      if (f > fmax) continue;
      const x = X(f);
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, plotH); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText(lab(f), Math.min(Math.max(x, 10), w - 10), h - 5);
    }
    if (!analyser) return;
    const bins = analyser.frequencyBinCount;
    if (!buf.current || buf.current.length !== bins) buf.current = new Float32Array(bins);
    const d = buf.current;
    analyser.getFloatFrequencyData(d);

    const fill = c.createLinearGradient(0, 0, 0, plotH);
    fill.addColorStop(0, 'rgba(139,92,246,.55)'); fill.addColorStop(1, 'rgba(99,102,241,.03)');
    c.beginPath(); c.moveTo(0, plotH);
    let top = '';
    for (let x = 0; x <= w; x += 2) {
      const f = fmin * Math.pow(fmax / fmin, x / w);
      const v = d[Math.min(bins - 1, Math.round((f / nyq) * (bins - 1)))];
      const y = plotH - Math.max(0, Math.min(1, (v + 100) / 80)) * (plotH - 4);
      c.lineTo(x, y); top = top || 'x';
    }
    c.lineTo(w, plotH); c.closePath(); c.fillStyle = fill; c.fill();
    c.strokeStyle = '#a78bfa'; c.lineWidth = 1.5; c.stroke();

    const now = performance.now();
    if (now - last.current > 100) {
      last.current = now;
      let mi = 1;
      for (let i = 1; i < bins; i++) if (d[i] > d[mi]) mi = i;
      setPeak(d[mi] > -90 ? (mi / (bins - 1)) * nyq : null);
    }
  };

  const active = status === 'active';
  return (
    <>
      <PageTitle title="Frequency Analyzer" text="Real-time FFT spectrum on a logarithmic frequency axis (20 Hz up to 20 kHz or the Nyquist limit)." />
      <Card className="space-y-4">
        <div className="flex items-end justify-between">
          <div><p className="label">Dominant frequency</p>
            <p className="text-3xl font-semibold tabular-nums">{peak === null ? '—' : peak >= 1000 ? `${(peak / 1000).toFixed(2)} kHz` : `${peak.toFixed(0)} Hz`}</p></div>
          {active && <p className="flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Listening</p>}
        </div>
        <Canvas draw={draw} label="Live frequency spectrum" className="h-56 sm:h-72" />
        {!active && status !== 'error' && <p className="text-sm text-white/50">Press Start to analyze sound from your microphone.</p>}
        <MicControls status={status} error={error} start={start} stop={stop} />
      </Card>
    </>
  );
}
