import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { BarChart3, Gauge, Heart, Waves } from 'lucide-react';
import Meter from './pages/Meter';
import Spectrum from './pages/Spectrum';
import Generator from './pages/Generator';
import Support from './pages/Support';

const NAV = [
  { to: '/', label: 'Meter', icon: Gauge },
  { to: '/spectrum', label: 'Spectrum', icon: BarChart3 },
  { to: '/generator', label: 'Generator', icon: Waves },
  { to: '/support', label: 'Support', icon: Heart },
];

const cls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
  }`;

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500"><Waves className="h-4 w-4" /></span>
            SonicLab
          </NavLink>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {NAV.map(({ to, label, icon: I }) => (
              <NavLink key={to} to={to} end className={cls}><I className="h-4 w-4" />{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-12">
        <Routes>
          <Route path="/" element={<Meter />} />
          <Route path="/spectrum" element={<Spectrum />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/60 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-indigo-300' : 'text-white/50'}`}>
              <I className="h-5 w-5" />{label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
