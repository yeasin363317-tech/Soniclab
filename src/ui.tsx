import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, Mic, Square } from 'lucide-react';
import type { MicStatus } from './useMic';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`glass ${className}`}>{children}</section>
);

export const PageTitle = ({ title, text }: { title: string; text: string }) => (
  <header className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
    <p className="mt-1 max-w-2xl text-sm text-white/60">{text}</p>
  </header>
);

export function MicControls({ status, error, start, stop }: { status: MicStatus; error: string; start: () => void; stop: () => void }) {
  return (
    <div className="space-y-3">
      {status === 'error' && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {status === 'active' ? (
        <button className="btn-ghost w-full sm:w-auto" onClick={stop}><Square className="h-4 w-4" /> Stop microphone</button>
      ) : (
        <button className="btn-primary w-full sm:w-auto" onClick={start} disabled={status === 'loading'}>
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {status === 'loading' ? 'Waiting for permission…' : 'Start microphone'}
        </button>
      )}
    </div>
  );
}
