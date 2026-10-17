import { useEffect, useRef } from 'react';

type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void;

export default function Canvas({ draw, label, className = 'h-48 sm:h-64' }: { draw: Draw; label: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fn = useRef(draw);
  fn.current = draw;

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext('2d')!;
    let raf = 0, w = 0, h = 0;
    const fit = () => {
      const d = window.devicePixelRatio || 1;
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      c.setTransform(d, 0, 0, d, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    const loop = () => { c.clearRect(0, 0, w, h); fn.current(c, w, h); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} role="img" aria-label={label} className={`block w-full rounded-xl bg-black/40 ${className}`} />;
}
