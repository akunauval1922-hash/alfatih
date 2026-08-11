import React, { useState } from 'react';
import { Landmark, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { loadAuthPassword } from '../lib/storage';

interface AuthOverlayProps {
  onLoginSuccess: (username: string) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password.trim();
      const storedPass = loadAuthPassword();

      if (u.length > 0) {
        onLoginSuccess(username.trim().toUpperCase());
      } else {
        setError('Masukkan nama akun / ID pengguna Anda.');
        setIsSubmitting(false);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Top Decorative Stripe */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-600 via-yellow-400 to-blue-600" />

        <div className="inline-flex bg-red-600 p-4 rounded-2xl text-white mb-4 shadow-lg shadow-red-200 mt-2">
          <Landmark className="w-8 h-8 text-yellow-300" />
        </div>

        <h1 className="text-xl font-black text-red-600 tracking-tight font-mono uppercase flex items-center justify-center gap-1.5 flex-wrap">
          KEUANGAN <span className="bg-yellow-400 text-red-950 text-xs px-2.5 py-0.5 rounded-full font-black">TIGA BERSAUDARA</span>
        </h1>
        <p className="text-xs text-slate-600 font-mono mt-1 mb-6 uppercase font-bold tracking-wider">
          SISTEM KEUANGAN & PERFORMA KARYAWAN
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-mono text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username / ID Member"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password / Kunci Sandi"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-yellow-300 font-extrabold py-4 rounded-xl font-mono text-xs shadow-lg shadow-red-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-yellow-300" />
            <span>{isSubmitting ? 'VERIFIKASI...' : 'MASUK SISTEM KEUANGAN'}</span>
          </button>

          <button
            type="button"
            onClick={() => onLoginSuccess(username.trim().toUpperCase() || 'ADMIN')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl font-mono text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>⚡ MASUK SISI LAIN / TANPA SANDI</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Akses Sistem</span>
          <span className="bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-emerald-800 font-extrabold">Terbuka Untuk Semua Akun / User</span>
        </div>
      </div>
    </div>
  );
};
