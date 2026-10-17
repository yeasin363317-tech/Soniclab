import { useCallback, useEffect, useRef, useState } from 'react';

export type MicStatus = 'idle' | 'loading' | 'active' | 'error';
type ACCtor = typeof AudioContext;
export const getAC = (): ACCtor | undefined =>
  window.AudioContext || (window as unknown as { webkitAudioContext?: ACCtor }).webkitAudioContext;

export function useMic() {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const release = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setAnalyser(null);
    setStatus('idle');
  }, [release]);

  const start = useCallback(async () => {
    const AC = getAC();
    if (!AC || !navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support microphone audio. Try a recent Chrome, Edge, Firefox or Safari over HTTPS or localhost.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const c = new AC();
      await c.resume();
      const a = c.createAnalyser();
      a.fftSize = 4096;
      a.smoothingTimeConstant = 0.8;
      c.createMediaStreamSource(s).connect(a); // not connected to destination: no feedback
      stream.current = s;
      ctx.current = c;
      setAnalyser(a);
      setStatus('active');
    } catch (e) {
      release();
      const name = (e as DOMException).name;
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was denied. Allow it in your browser settings, then press Start again.'
          : name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : name === 'NotReadableError'
              ? 'The microphone is busy or unavailable (another app may be using it).'
              : 'Could not start the microphone.',
      );
      setStatus('error');
    }
  }, [release]);

  useEffect(() => release, [release]);
  return { status, error, analyser, start, stop };
}
