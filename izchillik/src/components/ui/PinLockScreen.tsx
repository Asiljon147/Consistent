import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const PinLockScreen: React.FC = () => {
  const { unlockApp } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockApp(pin)) {
      setErrorMsg('');
    } else {
      setErrorMsg("PIN-kod noto'g'ri. Qaytadan urinib ko'ring.");
      setPin('');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Izchillik</h1>
          <p className="text-sm text-text-muted">Ilovani ochish uchun PIN-kodni kiriting</p>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            autoFocus
            className="w-full min-h-[48px] text-center text-base font-mono tracking-[0.4em] bg-bg border border-border rounded-xl px-4 text-text-primary focus:outline-none focus:border-accent"
          />
          {errorMsg && <p className="text-xs text-red-400 text-center">{errorMsg}</p>}
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-colors"
        >
          Ochish
        </button>
      </form>
    </div>
  );
};