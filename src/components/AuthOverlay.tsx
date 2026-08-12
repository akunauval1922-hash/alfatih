import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { loadAuthPassword } from '../lib/storage';

interface AuthOverlayProps {
  onLoginSuccess: (username: string) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'gmail' | 'username'>('gmail');
  const [gmailAddress, setGmailAddress] = useState('nnauval986@gmail.com');
  const [username, setUsername] = useState('ADMIN');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const storedPass = loadAuthPassword();

      if (loginMode === 'gmail') {
        const cleanEmail = gmailAddress.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setError('Masukkan alamat email Gmail yang valid (contoh: nama@gmail.com)');
          setIsSubmitting(false);
          return;
        }
        // Save session email and authenticate
        try {
          localStorage.setItem('app_session_user', cleanEmail);
          sessionStorage.setItem('app_session_user', cleanEmail);
        } catch (e) {}
        onLoginSuccess(cleanEmail);
      } else {
        const u = username.trim();
        if (u.length > 0) {
          try {
            localStorage.setItem('app_session_user', u.toUpperCase());
            sessionStorage.setItem('app_session_user', u.toUpperCase());
          } catch (e) {}
          onLoginSuccess(u.toUpperCase());
        } else {
          setError('Masukkan nama akun / ID pengguna Anda.');
          setIsSubmitting(false);
        }
      }
    }, 200);
  };

  const handleQuickGmailLogin = (email: string) => {
    setIsSubmitting(true);
    try {
      localStorage.setItem('app_session_user', email);
      sessionStorage.setItem('app_session_user', email);
    } catch (e) {}
    setTimeout(() => {
      onLoginSuccess(email);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Top Decorative Stripe */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-600 via-yellow-400 to-blue-600" />

        <div className="mb-3 mt-2 flex justify-center">
          <AppLogo size="xl" />
        </div>

        <h1 className="text-xl font-black text-red-600 tracking-tight font-mono uppercase flex items-center justify-center gap-1.5 flex-wrap">
          SYSTEM <span className="bg-yellow-400 text-red-950 text-xs px-2.5 py-0.5 rounded-full font-black">APLIKASI</span>
        </h1>
        <p className="text-xs text-slate-600 font-mono mt-1 mb-4 uppercase font-bold tracking-wider">
          SISTEM KEUANGAN & PERFORMA KARYAWAN
        </p>

        {/* Universal Access Status Banner */}
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-left text-emerald-950 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <div className="text-[11px] font-sans leading-tight">
            <p className="font-extrabold text-emerald-900 font-mono uppercase">AKSES KEAMANAN DIBUKA 100%</p>
            <p className="text-emerald-800">Semua akun Gmail (<code className="font-mono text-emerald-950 font-bold">*@gmail.com</code>) diizinkan masuk sistem.</p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 font-mono text-xs">
          <button
            type="button"
            onClick={() => { setLoginMode('gmail'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'gmail'
                ? 'bg-red-600 text-yellow-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>AKUN GMAIL</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('username'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'username'
                ? 'bg-red-600 text-yellow-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ID USER / NAMA</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-mono text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {loginMode === 'gmail' ? (
            <>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  placeholder="Masukkan Akun Gmail (contoh: nama@gmail.com)"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>

              {/* Quick Preset Buttons for Gmail */}
              <div className="text-left space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Pilih Akses Cepat Gmail:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickGmailLogin('nnauval986@gmail.com')}
                    className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-200 font-medium cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-red-600" />
                    <span>nnauval986@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGmailLogin('admin.tigabersaudara@gmail.com')}
                    className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-200 font-medium cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-red-600" />
                    <span>admin.tigabersaudara@gmail.com</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (Opsional)"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-yellow-300 font-extrabold py-3.5 rounded-xl font-mono text-xs shadow-lg shadow-red-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-yellow-300" />
            <span>{isSubmitting ? 'VERIFIKASI GMAIL...' : 'MASUK SISTEM KEUANGAN'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickGmailLogin(gmailAddress.trim() || 'nnauval986@gmail.com')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl font-mono text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>⚡ MASUK SEBAGAI GMAIL PENGGUNA</span>
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Keamanan Gmail</span>
          <span className="bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-emerald-800 font-extrabold">100% Bebas Akses Gmail</span>
        </div>
      </div>
    </div>
  );
};

