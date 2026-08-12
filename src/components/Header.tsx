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
            <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2 uppercase">
              <span>{activeTabTitle}</span>
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

      {/* Modal Petunjuk Instalasi & Mode Standalone */}
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
                  Mode Aplikasi Layar Penuh (100% Responsif)
                </h2>
                <p className="text-xs text-slate-500">
                  Aplikasi Keuangan 3 Bersaudara dioptimalkan untuk HP (iPhone & Android) dan Laptop.
                </p>
              </div>
            </div>

            {/* Direct Fullscreen Action */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-2xl mb-5 space-y-3 shadow-md border border-red-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-yellow-300 flex items-center gap-1.5 uppercase">
                  <Maximize className="w-4 h-4 text-yellow-300" />
                  <span>MODE APLIKASI STANDALONE</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                  SISTEM AKTIF
                </span>
              </div>
              <p className="text-xs text-red-50 leading-relaxed font-sans">
                Tekan tombol di bawah untuk mengaktifkan tampilan aplikasi secara penuh tanpa bilah alamat browser, persis seperti aplikasi native HP.
              </p>
              <button
                onClick={() => {
                  setShowInstallModal(false);
                  toggleFullscreen();
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-red-950 font-mono font-black text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Maximize className="w-4 h-4 text-red-950" />
                <span>⚡ BUKA TAMPILAN LAYAR PENUH SEKARANG</span>
              </button>
            </div>

            {/* PWA / Install Option if native browser prompt available */}
            {deferredPrompt && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-900 uppercase">
                    📱 DUKUNGAN INSTALASI PWA
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Browser Anda mendukung penginstalan aplikasi langsung ke layar utama HP/Komputer Anda.
                </p>
                <button
                  onClick={() => {
                    setShowInstallModal(false);
                    handlePromptInstallNative();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>PASANG KE LAYAR UTAMA (HOME SCREEN)</span>
                </button>
              </div>
            )}

            {/* Guarantees and Security Instructions */}
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="font-extrabold text-slate-900 text-xs uppercase font-mono text-red-600 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-red-600" />
                  <span>Jaminan Keamanan & Kemudahan Penggunaan:</span>
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1.5 font-sans leading-relaxed text-[11px]">
                  <li><strong>Data Terjaga 100% Lokal:</strong> Semua catatan disimpan langsung di browser perangkat Anda tanpa pihak ketiga.</li>
                  <li><strong>Layar Penuh Otomatis:</strong> Menggunakan fitur Mode Layar Penuh untuk sensasi memakai aplikasi asli di iPhone maupun Android.</li>
                  <li><strong>Backup Kapan Saja:</strong> Anda dapat mencadangkan seluruh data transaksi ke file Excel / JSON melalui menu Pengaturan (⚙️).</li>
                </ul>
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

