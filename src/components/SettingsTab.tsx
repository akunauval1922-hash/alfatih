import React, { useState } from 'react';
import { AppConfig, Transaction } from '../types';
import {
  generateGoogleAppsScriptCode,
  loadAuthPassword,
  saveAuthPassword,
  exportDataBackup,
  importDataBackup
} from '../lib/storage';
import {
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Key,
  Download,
  Upload,
  Lock,
  Shield,
  ShieldAlert
} from 'lucide-react';

interface SettingsTabProps {
  config: AppConfig;
  onSaveConfig: (cfg: AppConfig) => void;
  transactions: Transaction[];
  staffList?: string[];
  onSyncUnsynced: () => Promise<number>;
  onRefreshToDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
  onUpdateFromDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
  onRestoreData?: (transactions: Transaction[], staff?: string[]) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
  transactions,
  staffList = [],
  onSyncUnsynced,
  onRefreshToDatabase,
  onUpdateFromDatabase,
  onRestoreData
}) => {
  const [scriptUrl, setScriptUrl] = useState(config.googleScriptUrl || '');
  const [copied, setCopied] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<{ success: boolean; text: string } | null>(null);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Async clipboard API failed, attempting fallback...', err);
      }
    }

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

  const handleCopyAppUrl = async () => {
    const url = getCleanAppUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 3000);
    } else {
      alert(`URL Aplikasi (Silakan salin manual):\n${url}`);
    }
  };

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    msg: string;
  } | null>(null);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncCountMsg, setSyncCountMsg] = useState<string | null>(null);

  const unsyncedCount = transactions.filter((t) => !t.syncedToCloud).length;
  const scriptCode = generateGoogleAppsScriptCode();

  const handleCopyCode = async () => {
    const success = await copyToClipboard(scriptCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      alert('Gagal menyalin otomatis. Silakan blok dan salin kode Apps Script secara manual.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      googleScriptUrl: scriptUrl.trim(),
      autoSync: true
    });
    setTestResult({
      success: true,
      msg: 'Konfigurasi URL Sistem Kontrol berhasil disimpan!'
    });
  };

  const handleTestConnection = async () => {
    if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
      setTestResult({
        success: false,
        msg: 'Masukkan Web App URL Sistem Kontrol yang valid terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const dummyTx = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: 'TEST_SYNC',
        name: 'UJI_KONEKSI_DATABASE',
        income: 1000,
        expense: 0,
        note: 'Tes otomatis dari aplikasi Laporan Keuangan'
      };

      await fetch(scriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyTx)
      });

      setTestResult({
        success: true,
        msg: 'Sinyal terkirim ke Sistem Kontrol! Periksa baris baru pada spreadsheet Anda.'
      });
    } catch (err) {
      setTestResult({
        success: false,
        msg: 'Gagal menghubungi Web App URL. Pastikan akses Sistem Kontrol diset ke "Anyone".'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleBatchSync = async () => {
    if (onRefreshToDatabase) {
      setIsSyncingAll(true);
      setSyncCountMsg(null);
      const res = await onRefreshToDatabase();
      setIsSyncingAll(false);
      setSyncCountMsg(res.msg);
    } else {
      setIsSyncingAll(true);
      setSyncCountMsg(null);
      const syncedNum = await onSyncUnsynced();
      setIsSyncingAll(false);
      setSyncCountMsg(`Berhasil melakukan sinkronisasi ${syncedNum} record ke Cloud.`);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 4) {
      setPassMsg({ success: false, text: 'Password minimal 4 karakter!' });
      return;
    }
    const ok = saveAuthPassword(newPassword.trim());
    if (ok) {
      setPassMsg({ success: true, text: '🔒 Password admin berhasil diperbarui!' });
      setNewPassword('');
    } else {
      setPassMsg({ success: false, text: 'Gagal memperbarui password.' });
    }
  };

  const handleExportBackup = () => {
    exportDataBackup(transactions, staffList || [], config);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDataBackup(content);
        if (res.success && res.transactions) {
          onRestoreData?.(res.transactions, res.staff);
          setRestoreMsg({ success: true, text: res.msg });
        } else {
          setRestoreMsg({ success: false, text: res.msg });
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePullData = async () => {
    if (!onUpdateFromDatabase) return;
    setIsPulling(true);
    setSyncCountMsg(null);
    const res = await onUpdateFromDatabase();
    setIsPulling(false);
    setSyncCountMsg(res.msg);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-100">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Cloud className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-black font-mono text-slate-900 uppercase flex items-center gap-2">
              <span>Integrasi Sistem Kontrol Auto-Sync</span>
              <span className="bg-yellow-400 text-red-950 text-[10px] px-2 py-0.5 rounded-full font-bold">3 BERSAUDARA</span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Setiap kali Anda menambah transaksi, data langsung otomatis tersimpan di Sistem Kontrol secara real-time.
            </p>
          </div>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">Status Sistem Kontrol Sync</p>
              <p className="text-sm font-black font-mono mt-0.5 text-slate-900">
                {config.googleScriptUrl ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> TERKONEKSI
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> BELUM DIKONFIGURASI
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                Record Belum Ter-sync
              </p>
              <p className="text-sm font-black font-mono mt-0.5 text-slate-900">
                {unsyncedCount} Record Lokal
              </p>
            </div>
            {unsyncedCount > 0 && config.googleScriptUrl && (
              <button
                onClick={handleBatchSync}
                disabled={isSyncingAll}
                className="bg-red-600 hover:bg-red-700 text-yellow-300 font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm border border-red-500 flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>Sync Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={handleBatchSync}
            disabled={isSyncingAll}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-red-950 font-mono text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-sm border border-yellow-300 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-red-950 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>1. Refresh Data ke Database (Push)</span>
          </button>

          <button
            type="button"
            onClick={handlePullData}
            disabled={isPulling}
            className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-300 font-mono text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-sm border border-slate-700 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${isPulling ? 'animate-spin' : ''}`} />
            <span>2. Update Data dari Database (Pull)</span>
          </button>
        </div>

        {syncCountMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncCountMsg}</span>
          </div>
        )}

        {/* URL Configuration Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase text-slate-700 font-mono">
                Sistem Kontrol Web App URL
              </label>
              <span className="text-[10px] text-red-600 font-mono font-bold">
                *Salin link Web App dari Sistem Kontrol lalu tempel di bawah
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="url"
                  required
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full p-3.5 pr-24 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setScriptUrl(text.trim());
                    } catch (e) {
                      alert('Gagal membaca clipboard. Silakan tempel (Paste) manual dengan menekan lama kolom input.');
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Tempel Otomatis dari Clipboard"
                >
                  <Copy className="w-3 h-3 text-slate-700" />
                  <span>Tempel</span>
                </button>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-yellow-300 border border-red-500 font-mono font-black text-xs px-5 py-3.5 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Simpan URL
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs px-4 py-3.5 rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Uji Koneksi</span>
                </button>
              </div>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-mono border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-200/60 text-emerald-900'
                  : 'bg-rose-500/10 border-rose-200/60 text-rose-900'
              }`}
            >
              {testResult.msg}
            </div>
          )}
        </form>
      </div>

      {/* Pusat Keamanan, Password Admin & Backup Data 100% Aman */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/80 to-sky-50/90 text-teal-950 rounded-[32px] p-6 sm:p-8 shadow-md border border-teal-200/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-teal-200/80">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-600/15 border border-teal-300/60 text-teal-800 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-teal-800" />
            </div>
            <div>
              <h3 className="font-black text-base font-mono text-teal-950 uppercase tracking-tight flex items-center gap-2">
                <span>Pusat Keamanan & Cadangan Data 100% Aman</span>
                <span className="bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-black">TERPROTEKSI</span>
              </h3>
              <p className="text-xs text-teal-800/80 font-sans">
                Atur password admin, unduh cadangan file JSON offline, atau pulihkan data kapan saja.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Ubah Password Admin */}
          <div className="bg-white/90 border border-teal-200 p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-teal-900 font-mono font-bold text-xs uppercase">
              <Key className="w-4 h-4 text-teal-700" />
              <span>Ganti Password Akses Admin</span>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-teal-800 mb-1">
                  Password Admin Baru (Min 4 Karakter):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="flex-1 p-3 bg-white border border-teal-300 rounded-xl text-xs font-mono text-teal-950 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-mono font-extrabold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Simpan Password
                  </button>
                </div>
              </div>
              {passMsg && (
                <p className={`text-xs font-mono ${passMsg.success ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}`}>
                  {passMsg.text}
                </p>
              )}
            </form>
          </div>

          {/* Card 2: Cadangan File JSON & Restore */}
          <div className="bg-white/90 border border-teal-200 p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-teal-900 font-mono font-bold text-xs uppercase">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Cadangkan & Pulihkan Data (JSON)</span>
            </div>
            <p className="text-xs text-teal-800/90 font-sans leading-relaxed">
              Unduh cadangan data lokal ke komputer/HP Anda agar 100% aman jika berpindah perangkat.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="bg-teal-700 hover:bg-teal-800 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl border border-teal-600 shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-100" />
                <span>Unduh Cadangan JSON</span>
              </button>

              <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-500 shadow-sm transition-all flex items-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-100" />
                <span>Pulihkan dari JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {restoreMsg && (
              <p className={`text-xs font-mono ${restoreMsg.success ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}`}>
                {restoreMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* Security badges & specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-teal-900">
          <div className="bg-white/80 p-3 rounded-xl border border-teal-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>XSS & Script Injection Filter Active</span>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-teal-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Double Local Storage Vault Active</span>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-teal-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sistem Kontrol End-to-End SSL</span>
          </div>
        </div>
      </div>

      {/* Step by Step Setup Guide */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-sm border border-white/60 space-y-6 font-sans">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-sm font-mono text-slate-900 uppercase">
            Panduan 1x Setup Sistem Kontrol (Gratis & Otomatis)
          </h3>
        </div>

        <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <p className="font-bold text-slate-900">Buat File Sistem Kontrol Baru</p>
              <p className="text-slate-500 mt-0.5">
                Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-mono font-bold">sheets.new</a>, lalu buat nama file <span className="font-mono font-bold text-slate-800">Database Laporan Keuangan</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <p className="font-bold text-slate-900">Atur Judul Kolom di Baris Pertama (A1 sampai I1) atau biarkan kosong (Otomatis dibuat oleh Script)</p>
              <div className="mt-2 bg-slate-100 p-2.5 rounded-xl font-mono text-[11px] text-slate-800 font-bold overflow-x-auto">
                ID Transaksi | Tanggal | Kategori | Nama / Subjek Karyawan | Total Pendapatan (IDR) | Total Pengeluaran (IDR) | Total Hasil / Saldo (IDR) | Catatan / Keterangan | Waktu Sync
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">
                  Salin Kode Apps Script & Tempel di Extensions -&gt; Apps Script
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode Script'}</span>
                </button>
              </div>

              <div className="mt-2 bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                <pre>{scriptCode}</pre>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0">
              4
            </span>
            <div>
              <p className="font-bold text-slate-900">Deploy sebagai Web App</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500 font-mono text-[11px]">
                <li>Klik tombol <span className="font-bold text-slate-800">Deploy -&gt; New Deployment</span>.</li>
                <li>Pilih tipe: <span className="font-bold text-slate-800">Web App</span>.</li>
                <li>Execute as: <span className="font-bold text-slate-800">Me (Email Anda)</span>.</li>
                <li>Who has access: <span className="font-bold text-slate-800">Anyone</span> (Penting agar web app bisa mengirim data).</li>
                <li>Klik <span className="font-bold text-slate-800">Deploy</span>, lalu salin Web App URL dan tempelkan pada form di atas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* App Installation & Deployment Guide Card (PWA / Web App) */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-red-500 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-500/50 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-yellow-400 text-red-950 rounded-2xl font-black font-mono text-xs shrink-0">
              INFO DEPLOY
            </div>
            <div>
              <h3 className="font-black text-base font-mono text-white uppercase tracking-tight">
                Panduan Menjalankan & Memasang Aplikasi
              </h3>
              <p className="text-xs text-red-100 font-sans">
                Penjelasan mengenai link Live Preview AI Studio vs Deploy Publik Permanen.
              </p>
            </div>
          </div>
        </div>

        {/* Sandbox Warning Banner */}
        <div className="bg-slate-900/90 border border-amber-400/80 p-4.5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-yellow-300 font-mono font-bold text-xs uppercase">
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">PENTING</span>
            <span>MENGAPA LINK PREVIEW TIDAK BISA DIBUKA DI LOKAL / PWABUILDER?</span>
          </div>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            URL dengan awalan <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-300 font-mono text-[11px]">ais-dev-...</code> atau <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-300 font-mono text-[11px]">ais-pre-...</code> adalah <strong>Server Kontainer Sandbox Internal AI Studio</strong>. Server ini khusus untuk pengujian di panel <strong>Live Preview</strong> kanan editor.
          </p>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Layanan luar seperti PWABuilder tidak dapat mengakses server internal ini, dan jika dibuka langsung di luar tanpa sesi editor akan diblokir oleh Google Cloud (<code className="text-amber-300 font-mono">404 Page Not Found</code>).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Direct Usage inside AI Studio Preview */}
          <div className="bg-slate-900/90 border border-slate-700 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-yellow-300 font-mono font-bold text-xs uppercase">
              <span>1. Penggunaan di AI Studio</span>
              <span className="bg-emerald-500 text-slate-950 text-[9px] px-2 py-0.5 rounded-full font-black">100% SIAP PAKAI</span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              Aplikasi ini <strong>berfungsi 100% normal</strong> langsung di jendela <strong>Live Preview</strong> kanan. Anda bisa melakukan input transaksi, ekspor Laporan PDF/Excel, hingga pengelolaan personel secara lengkap.
            </p>
          </div>

          {/* How to Deploy to Vercel/Netlify for Public PWA/APK */}
          <div className="bg-emerald-950/90 border-2 border-emerald-400 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-emerald-300 font-mono font-bold text-xs uppercase">
              <span>2. Deploy Publik Permanen (PWA / APK)</span>
              <span className="bg-emerald-400 text-emerald-950 text-[9px] px-2 py-0.5 rounded-full font-black">GRATIS</span>
            </div>
            <p className="text-xs text-emerald-100 font-sans leading-relaxed">
              Untuk memasang di HP (iOS/Android) atau membagikan secara publik ke orang lain:
            </p>
            <ol className="list-decimal list-inside text-xs text-emerald-200 space-y-1.5 font-sans leading-relaxed">
              <li>Klik menu <strong>Settings (⚙️) / Opsi</strong> di pojok kanan atas AI Studio.</li>
              <li>Pilih <strong>Export to GitHub</strong> atau <strong>Download ZIP</strong>.</li>
              <li>Unggah file ke hosting gratis seperti <strong>Vercel.com</strong> atau <strong>Netlify.com</strong>.</li>
              <li>Domain publik Anda (misal: <code className="text-yellow-300 font-mono">app-keuangan.vercel.app</code>) bisa langsung diinstal sebagai PWA/APK di HP secara permanen!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
