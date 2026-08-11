import React, { useState, useEffect } from 'react';
import { Menu, Search, Calendar, Cloud, CloudOff, RefreshCw, Smartphone, X, Copy, Check, Info, Maximize, Minimize, ArrowUpRight, ArrowDownLeft, ExternalLink, Download } from 'lucide-react';

interface HeaderProps {
  activeTabTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  availableMonths: string[];
  liveClock: string;
  hasGoogleScript: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  isSyncing?: boolean;
  onRefreshToDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
  onUpdateFromDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  searchQuery,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  liveClock,
  hasGoogleScript,
  onToggleSidebar,
  onOpenSettings,
  isSyncing = false,
  onRefreshToDatabase,
  onUpdateFromDatabase
}) => {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isProcessingSync, setIsProcessingSync] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleRefreshPush = async () => {
    if (!onRefreshToDatabase) return;
    setIsProcessingSync(true);
    setSyncStatusMsg(null);
    const res = await onRefreshToDatabase();
    setIsProcessingSync(false);
    setSyncStatusMsg(res.msg);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleUpdatePull = async () => {
    if (!onUpdateFromDatabase) return;
    setIsProcessingSync(true);
    setSyncStatusMsg(null);
    const res = await onUpdateFromDatabase();
    setIsProcessingSync(false);
    setSyncStatusMsg(res.msg);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const getCleanAppUrl = (): string => {
    try {
      let url = window.location.href;
      if (url.includes('ais-dev-')) {
        url = url.replace('ais-dev-', 'ais-pre-');
      }
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (e) {
      return 'https://ais-pre-dipjevuv75l54h77dbjym5-198459841037.asia-southeast1.run.app/';
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern Async Clipboard API
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Async clipboard API failed, attempting fallback...', err);
      }
    }

    // 2. Fallback using invisible textarea
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('ExecCommand copy failed:', err);
      return false;
    }
  };

  const handleCopyLink = async () => {
    const cleanUrl = getCleanAppUrl();
    const success = await copyToClipboard(cleanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 4000);
  };

  const handlePromptInstallNative = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;

    try {
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (req) {
          const res = req.call(docEl);
          if (res && typeof res.then === 'function') {
            res.then(() => setIsFullscreen(true)).catch(() => setShowInstallModal(true));
          } else {
            setIsFullscreen(true);
          }
        } else {
          setShowInstallModal(true);
        }
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          const res = exit.call(doc);
          if (res && typeof res.then === 'function') {
            res.then(() => setIsFullscreen(false)).catch(() => {});
          } else {
            setIsFullscreen(false);
          }
        }
      }
    } catch (e) {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <header className="h-16 sm:h-20 bg-red-600 text-white border-b border-red-700 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-red-700 hover:bg-red-800 text-white transition-colors cursor-pointer"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-2 uppercase">
              <span>{activeTabTitle}</span>
              <span className="hidden sm:inline-block bg-yellow-400 text-red-950 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black uppercase tracking-wider">
                3 BERSAUDARA
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-red-100 uppercase tracking-tight">
              WAKTU SISTEM: <span className="text-yellow-300 font-bold">{liveClock}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Global Search */}
          <div className="relative hidden lg:block">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-red-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari transaksi..."
              className="pl-9 pr-4 py-2 bg-red-700/80 hover:bg-red-700 focus:bg-white focus:text-slate-900 border border-red-500 rounded-xl text-xs outline-none transition-all w-40 sm:w-52 font-sans text-white placeholder-red-200"
            />
          </div>

          {/* Month Filter */}
          <div className="relative hidden sm:flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 text-red-300 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="pl-8 pr-3 py-2 bg-red-700 hover:bg-red-800 border border-red-500 rounded-xl text-xs font-bold text-white outline-none cursor-pointer font-mono"
            >
              <option value="ALL" className="text-slate-900">Semua Periode (Tak Terbatas)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="text-slate-900">
                  Periode {m}
                </option>
              ))}
            </select>
          </div>

          {/* Install App HP Button */}
          <button
            onClick={handlePromptInstallNative}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all border bg-yellow-400 hover:bg-yellow-300 text-red-950 border-yellow-300 cursor-pointer shadow-sm"
            title="Cara Pasang Aplikasi di HP (iPhone & Android)"
          >
            <Smartphone className="w-3.5 h-3.5 text-red-950" />
            <span className="hidden sm:inline uppercase">PASANG APP HP</span>
          </button>

          {/* Fullscreen Mode Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all border bg-red-700 hover:bg-red-800 text-white border-red-500 cursor-pointer"
            title="Tampilan Layar Penuh Mode Aplikasi"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
          </button>

          {/* Cloud Status Badge */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all border cursor-pointer ${
              hasGoogleScript
                ? 'bg-red-800 text-yellow-300 border-red-500 hover:bg-red-900'
                : 'bg-red-800 text-yellow-300 border-red-500 hover:bg-red-900'
            }`}
            title="Pengaturan Sistem Kontrol"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-300" />
            ) : hasGoogleScript ? (
              <Cloud className="w-3.5 h-3.5 text-yellow-300" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-yellow-300" />
            )}
            <span className="hidden xl:inline">
              {hasGoogleScript ? 'Sistem Kontrol: Aktif' : 'Sistem Kontrol'}
            </span>
          </button>
        </div>
      </header>

      {syncStatusMsg && (
        <div className="bg-teal-800 text-teal-100 border-b border-teal-700 px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-between shadow-md animate-fade-in z-30">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="p-1 hover:bg-teal-700 rounded-lg text-teal-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Petunjuk Instalasi App */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-600 text-yellow-300 rounded-2xl">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black font-mono text-slate-900">
                  Cara Pasang Aplikasi di iPhone / Android
                </h2>
                <p className="text-xs text-slate-500">
                  Aplikasi berbasis Web App (PWA) yang bisa dipasang di layar utama HP.
                </p>
              </div>
            </div>

            {/* CRITICAL WARNING FOR AI STUDIO PREVIEW USERS */}
            <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl mb-4 border-2 border-amber-400 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <p className="font-extrabold text-xs sm:text-sm uppercase tracking-tight font-mono">
                  Kenapa Keluar Bacaan "Playground"? Ini Solusinya:
                </p>
              </div>
              <p className="text-xs leading-relaxed font-sans font-medium text-slate-900">
                Bacaan <strong>Playground</strong> muncul karena Anda menyimpan URL editor internal AI Studio. Supaya terbuka langsung sebagai <strong>Aplikasi Penuh Tanpa Playground</strong>, gunakan tombol di bawah ini:
              </p>
              <div className="p-3 bg-white/95 rounded-xl border border-amber-600/30 text-xs text-slate-900 space-y-2">
                <p className="font-bold text-amber-950">Cara Membuka Aplikasi Standalone Publik:</p>
                <ol className="list-decimal list-inside space-y-1 font-medium text-[11px] text-slate-800">
                  <li>Klik tombol <strong className="text-red-700 font-bold">"🚀 Buka Aplikasi Publik (Tab Baru)"</strong> di bawah.</li>
                  <li>Di halaman tab baru tersebut, klik menu browser Chrome/Safari -&gt; <strong className="text-red-700 font-bold">"Tambah ke Layar Utama"</strong>.</li>
                  <li>Ikon aplikasi di HP Anda sekarang 100% langsung terbuka tanpa bacaan playground!</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={getCleanAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-mono font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer no-underline"
                >
                  <ExternalLink className="w-4 h-4 text-yellow-300" />
                  <span>🚀 Buka Aplikasi Publik (Tab Baru)</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="bg-red-700 hover:bg-red-800 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-yellow-300" /> : <Copy className="w-3.5 h-3.5 text-yellow-300" />}
                  <span>{copiedLink ? 'Link Disalin!' : 'Salin Link Publik'}</span>
                </button>
              </div>
            </div>

            {/* Direct Link Input Box & Copy Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4 border border-slate-700 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-yellow-300 flex items-center gap-1.5 uppercase">
                  <Copy className="w-4 h-4 text-yellow-300" />
                  <span>LINK RESMI APLIKASI:</span>
                </span>
                {copiedLink && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    BERHASIL DISALIN!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <input
                  type="text"
                  readOnly
                  value={getCleanAppUrl()}
                  className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none select-all px-2"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-yellow-300 font-mono font-black text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-yellow-300" /> : <Copy className="w-4 h-4 text-yellow-300" />}
                  <span>{copiedLink ? 'DISALIN' : 'SALIN LINK'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {deferredPrompt && (
                  <button
                    onClick={handlePromptInstallNative}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer border border-emerald-500"
                  >
                    <Download className="w-4 h-4 text-yellow-300" />
                    <span>📲 INSTAL APLIKASI SEKARANG (OTOMATIS)</span>
                  </button>
                )}
                <a
                  href={getCleanAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-mono font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer border border-teal-600 no-underline"
                >
                  <ExternalLink className="w-4 h-4 text-yellow-300" />
                  <span>🚀 BUKA DI TAB BARU (STANDALONE)</span>
                </a>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Laptop/PC Section - PROMINENT */}
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-300 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                    <span className="text-base">💻</span> Panduan Komputer & Laptop (Windows PC / Mac)
                  </p>
                  <span className="bg-blue-600 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full">
                    CHROME & EDGE DESKTOP
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-200 text-slate-800 leading-relaxed text-xs space-y-1.5">
                  <p className="font-bold text-blue-950">Langkah Membuka di Komputer Tanpa Frame / Tanpa Eror:</p>
                  <ol className="list-decimal list-inside space-y-1 font-medium text-[11px] text-slate-700">
                    <li>Klik tombol <strong className="text-teal-700 font-bold">"🚀 Buka Di Tab Baru (Standalone)"</strong> di atas agar aplikasi terbuka penuh di tab browser komputer Anda.</li>
                    <li>Di tab baru tersebut, lihat **Address Bar (Bilah URL)** Chrome/Edge di bagian kanan atas.</li>
                    <li>Klik ikon **"Pasang Aplikasi / Install"** (ikon komputer dengan panah ke bawah <strong className="text-blue-700">⊕</strong>).</li>
                    <li>Aplikasi akan terpasang langsung di Desktop Komputer / Laptop Anda sebagai Aplikasi Mandiri!</li>
                  </ol>
                </div>
              </div>
              {/* iOS / iPhone Section - HIGHLIGHTED */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                    <span className="text-base">🍎</span> Panduan Khusus iPhone / iPad (Safari)
                  </p>
                  <span className="bg-amber-200 text-amber-900 font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300">
                    WAJIB BROWSER SAFARI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 shadow-xs">
                    <p className="font-extrabold text-amber-900 flex items-center gap-1">
                      <span className="bg-amber-100 text-amber-900 w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]">1</span>
                      <span>Salin Link & Buka Safari</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Klik tombol <strong>"Salin Link App"</strong> di atas. Buka aplikasi <strong>Safari</strong> (browser kompas di iPhone), lalu <strong>Tempel (Paste)</strong> link.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 shadow-xs">
                    <p className="font-extrabold text-amber-900 flex items-center gap-1">
                      <span className="bg-amber-100 text-amber-900 w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]">2</span>
                      <span>Tekan Tombol Share (⎘)</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Di bilah bawah Safari, ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <strong className="text-amber-800">⎘</strong>).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 shadow-xs">
                    <p className="font-extrabold text-amber-900 flex items-center gap-1">
                      <span className="bg-amber-100 text-amber-900 w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]">3</span>
                      <span>Pilih "Tambah ke Layar Utama"</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Gulir opsi ke bawah dan pilih menu <strong>"Tambah ke Layar Utama"</strong> (atau <i>Add to Home Screen</i>).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 shadow-xs">
                    <p className="font-extrabold text-amber-900 flex items-center gap-1">
                      <span className="bg-amber-100 text-amber-900 w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]">4</span>
                      <span>Klik "Tambah" / "Add"</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Icon aplikasi akan otomatis terpasang di layar iPhone Anda!
                    </p>
                  </div>
                </div>
              </div>

              {/* Android */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-extrabold text-slate-900 text-sm mb-1 text-red-600">
                  📱 Android (Google Chrome)
                </p>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Buka link aplikasi ini di browser <strong>Google Chrome</strong>.</li>
                  <li>Ketuk ikon <strong>Titik Tiga (⋮)</strong> di kanan atas.</li>
                  <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
                  <li>Aplikasi akan otomatis muncul di menu/layar utama HP Anda.</li>
                </ol>
              </div>

              {/* PWABuilder Section */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                    <span>📦</span> Bikin File APK Gratis via PWABuilder.com
                  </p>
                  <span className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    FREE APK BUILDER
                  </span>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  PWABuilder.com adalah layanan resmi gratis dari Microsoft untuk mengubah Web App menjadi file installer <strong>Android (APK)</strong> atau <strong>iOS App</strong>.
                </p>

                <ol className="list-decimal list-inside text-slate-700 space-y-1 text-xs">
                  <li>Klik tombol <strong className="text-emerald-800">"Salin & Buka PWABuilder"</strong> di bawah.</li>
                  <li>Di PWABuilder.com, <strong>Tempel (Paste)</strong> URL aplikasi ini di kolom input, lalu klik <strong className="text-emerald-800 font-bold">Start</strong>.</li>
                  <li>Setelah analisis selesai, klik <strong className="text-emerald-800 font-bold">Package for Store</strong>.</li>
                  <li>Pilih <strong className="text-emerald-800 font-bold">Android</strong> untuk mengunduh file <strong>.APK</strong> gratis yang bisa langsung diinstal di HP!</li>
                </ol>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(getCleanAppUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCopyLink}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-mono font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2 no-underline"
                >
                  <Copy className="w-4 h-4 text-white" />
                  <span>Salin URL & Buka PWABuilder.com Now</span>
                </a>
              </div>

              {/* Laptop/PC */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="font-extrabold text-slate-900 text-sm mb-1 text-red-600">
                  💻 Laptop / PC (Chrome & Edge)
                </p>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Buka link di browser <strong>Chrome / Edge</strong>.</li>
                  <li>Klik ikon <strong>Instal Aplikasi (⊕)</strong> pada bilah alamat URL (Address Bar) kanan atas.</li>
                  <li>Aplikasi akan terbuka sebagai jendela aplikasi mandiri tanpa baris URL.</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs px-6 py-3 rounded-xl cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

