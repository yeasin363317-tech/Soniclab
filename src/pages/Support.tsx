import { ExternalLink, Heart } from 'lucide-react';
import { Card } from '../ui';

export default function Support() {
  return (
    <Card className="mx-auto mt-6 max-w-xl text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500"><Heart className="h-6 w-6" /></span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Support the Developer</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
        SonicLab is free and runs entirely in your browser. If it helps you, a small contribution keeps new tools and improvements coming.
      </p>
      <a href="https://supportkori.com/devyeasin" target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
        Support on SupportKori <ExternalLink className="h-4 w-4" />
      </a>
    </Card>
  );
}
