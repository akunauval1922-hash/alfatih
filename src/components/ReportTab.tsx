import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah, exportToExcel, isSembakoTx, isOperasionalTx } from '../lib/storage';
import { exportToPdf } from '../lib/pdfExport';
import {
  FileSpreadsheet,
  Printer,
  Trash2,
  FileText,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  X,
  FileDown,
  Cloud,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Filter,
  Search,
  ShieldCheck,
  Building2,
  ListFilter,
  ShoppingBag,
  Wrench,
  Calendar,
  Layers,
  Check
} from 'lucide-react';

interface ReportTabProps {
  transactions: Transaction[];
  staffList: string[];
  onClearAllData: () => void;
  googleScriptUrl?: string;
  onOpenSettings?: () => void;
  onSyncUnsynced?: () => Promise<number>;
  onRefreshToDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
  onUpdateFromDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
}

const formatIndoDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${day} ${months[month - 1] || parts[1]} ${year}`;
};

const formatIndoMonth = (monthStr: string) => {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[month - 1] || parts[1]} ${year}`;
};

export const ReportTab: React.FC<ReportTabProps> = ({
  transactions,
  staffList,
  onClearAllData,
  googleScriptUrl,
  onOpenSettings,
  onSyncUnsynced,
  onRefreshToDatabase,
  onUpdateFromDatabase
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  
  // Pilihan Cetak Laporan States
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'personel' | 'logistik' | 'layanan'>('ALL');
  const [selectedPeriodType, setSelectedPeriodType] = useState<'ALL' | 'daily' | 'monthly'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const shiftSelectedMonth = (deltaMonths: number) => {
    const parts = (selectedMonth || currentMonthStr).split('-');
    let y = parseInt(parts[0], 10) || new Date().getFullYear();
    let m = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
    m += deltaMonths;
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const shiftSelectedDate = (deltaDays: number) => {
    const d = new Date(selectedDate || todayStr);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReportView, setActiveReportView] = useState<'summary' | 'details'>('summary');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const unsyncedCount = transactions.filter((t) => !t.syncedToCloud).length;

  const handlePushDatabase = async () => {
    if (!onRefreshToDatabase) return;
    setIsSyncing(true);
    setSyncMsg(null);
    const res = await onRefreshToDatabase();
    setIsSyncing(false);
    setSyncMsg(res.msg);
    setTimeout(() => setSyncMsg(null), 5000);
  };

  const handlePullDatabase = async () => {
    if (!onUpdateFromDatabase) return;
    setIsSyncing(true);
    setSyncMsg(null);
    const res = await onUpdateFromDatabase();
    setIsSyncing(false);
    setSyncMsg(res.msg);
    setTimeout(() => setSyncMsg(null), 5000);
  };

  const handleOpenGoogleSheets = () => {
    if (googleScriptUrl && googleScriptUrl.trim()) {
      window.open(googleScriptUrl.trim(), '_blank');
    } else if (onOpenSettings) {
      onOpenSettings();
    }
  };

  const handleConfirmReset = () => {
    onClearAllData();
    setIsResetModalOpen(false);
    setResetSuccessMsg('Database transaksi & daftar karyawan berhasil dibersihkan / di-reset ke standar.');
    setTimeout(() => {
      setResetSuccessMsg('');
    }, 4000);
  };

  // Filtered transactions for reports based on category & period
  const reportTransactions = transactions.filter((t) => {
    // 1. Category Filter
    let matchesCategory = true;
    if (selectedCategory === 'personel') {
      matchesCategory = t.category === 'personel' || staffList.includes(t.name);
    } else if (selectedCategory === 'logistik') {
      matchesCategory = isSembakoTx(t);
    } else if (selectedCategory === 'layanan') {
      matchesCategory = isOperasionalTx(t);
    }

    // 2. Period Filter
    let matchesPeriod = true;
    if (selectedPeriodType === 'daily') {
      matchesPeriod = t.date === selectedDate;
    } else if (selectedPeriodType === 'monthly') {
      matchesPeriod = t.date.startsWith(selectedMonth);
    }

    // 3. Search Query
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.date.includes(searchQuery);

    return matchesCategory && matchesPeriod && matchesSearch;
  });

  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case 'personel':
        return 'Karyawan / Staf';
      case 'logistik':
        return 'Sembako & Logistik';
      case 'layanan':
        return 'Layanan & Operasional';
      default:
        return 'Keseluruhan (Semua Kategori)';
    }
  };

  const getPeriodLabel = () => {
    if (selectedPeriodType === 'daily') {
      return `Harian (${formatIndoDate(selectedDate)})`;
    } else if (selectedPeriodType === 'monthly') {
      return `Bulanan (${formatIndoMonth(selectedMonth)})`;
    } else {
      return 'Semua Periode (Tak Terbatas)';
    }
  };

  const handleExportExcel = () => {
    exportToExcel(reportTransactions, staffList, getCategoryLabel(), getPeriodLabel());
  };

  const handleExportPdf = () => {
    exportToPdf(reportTransactions, staffList, getCategoryLabel(), getPeriodLabel());
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Calculated Totals for selected filtered report
  let grandIncome = 0;
  let grandExpense = 0;
  let totalIncomeCount = 0;
  let totalExpenseCount = 0;

  reportTransactions.forEach((t) => {
    const inc = t.income || 0;
    const exp = t.expense || 0;
    grandIncome += inc;
    grandExpense += exp;
    if (inc > 0) totalIncomeCount++;
    if (exp > 0) totalExpenseCount++;
  });

  const grandNet = grandIncome - grandExpense;
  const netProfitMargin = grandIncome > 0 ? ((grandNet / grandIncome) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {resetSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-200/60 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-mono font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetSuccessMsg}</span>
        </div>
      )}

      {/* Pusat Audit & Ekspor Laporan (Unified, Compact & Beautiful) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200/90 space-y-5 print:hidden relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700" />

        {/* Top Header Row with Title & Cloud/Reset Utility Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200/80 shadow-2xs shrink-0">
              <Printer className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-mono uppercase">
                  PUSAT LAPORAN KEUANGAN TIGA BERSAUDARA
                </h2>
                <span className="bg-teal-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black tracking-wider uppercase shadow-2xs">
                  REALTIME DATA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-tight mt-0.5">
                PUSAT FILTER TRANSAKSI, CETAK DOKUMEN RESMI, EKSPOR PDF/EXCEL, SERTA SINKRONISASI SISTEM KONTROL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleOpenGoogleSheets}
              className="bg-teal-50 hover:bg-teal-100 text-teal-900 font-mono font-bold text-xs px-3.5 py-2.5 rounded-2xl border border-teal-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              title={googleScriptUrl ? "Buka Sistem Kontrol" : "Pengaturan Sistem Kontrol"}
            >
              <Cloud className="w-4 h-4 text-teal-600" />
              <span>Sistem Kontrol</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-mono font-bold text-xs px-3.5 py-2.5 rounded-2xl border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              title="Hapus seluruh data lokal"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Reset DB</span>
            </button>
          </div>
        </div>

        {/* Compact Filter Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
          {/* 1. Kategori Filter (Pills) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>1. Filter Kategori Laporan:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs ring-2 ring-teal-700/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50/60 hover:border-teal-300'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('personel')}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                  selectedCategory === 'personel'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-2 ring-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60 hover:border-emerald-300'
                }`}
              >
                Karyawan
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('logistik')}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                  selectedCategory === 'logistik'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-2 ring-amber-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/60 hover:border-amber-300'
                }`}
              >
                Logistik
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('layanan')}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                  selectedCategory === 'layanan'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-2 ring-rose-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/60 hover:border-rose-300'
                }`}
              >
                Operasional
              </button>
            </div>
          </div>

          {/* 2. Periode Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Filter Periode Waktu:</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodType('ALL')}
                  className={`px-2.5 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                    selectedPeriodType === 'ALL'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50/60 hover:border-teal-300'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodType('daily')}
                  className={`px-2.5 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                    selectedPeriodType === 'daily'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50/60 hover:border-teal-300'
                  }`}
                >
                  Harian
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriodType('monthly')}
                  className={`px-2.5 py-2.5 rounded-xl text-xs font-mono font-bold text-center transition-all border cursor-pointer ${
                    selectedPeriodType === 'monthly'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50/60 hover:border-teal-300'
                  }`}
                >
                  Bulanan
                </button>
              </div>

              {selectedPeriodType === 'daily' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftSelectedDate(-1)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all text-xs font-bold font-mono cursor-pointer"
                    title="Hari Sebelumnya"
                  >
                    ◀
                  </button>
                  <input
                    type="date"
                    min="1900-01-01"
                    max="2099-12-31"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border-2 border-teal-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => shiftSelectedDate(1)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all text-xs font-bold font-mono cursor-pointer"
                    title="Hari Berikutnya"
                  >
                    ▶
                  </button>
                </div>
              )}

              {selectedPeriodType === 'monthly' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftSelectedMonth(-1)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all text-xs font-bold font-mono cursor-pointer"
                    title="Bulan Sebelumnya"
                  >
                    ◀
                  </button>
                  <input
                    type="month"
                    min="1900-01"
                    max="2099-12"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white border-2 border-teal-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => shiftSelectedMonth(1)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all text-xs font-bold font-mono cursor-pointer"
                    title="Bulan Berikutnya"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges & Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
              Kategori: <strong className="text-teal-800">{getCategoryLabel()}</strong>
            </span>
            <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
              Periode: <strong className="text-teal-800">{getPeriodLabel()}</strong>
            </span>
            <span className="bg-teal-700 text-white px-3 py-1.5 rounded-xl font-black shadow-2xs">
              {reportTransactions.length} Record Log
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer border border-teal-600"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>CETAK LAPORAN</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer border border-emerald-500"
            >
              <FileDown className="w-4 h-4 text-emerald-100" />
              <span>EKSPOR PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer border border-sky-500"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-100" />
              <span>EKSPOR EXCEL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards for Selected Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono print:gap-3">
        {/* Card 1: Pendapatan Kas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-400 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-3 relative">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Pendapatan Kas ({getCategoryLabel()})</span>
              </span>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {getPeriodLabel()}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-2">
            {formatRupiah(grandIncome)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-sans">{totalIncomeCount} Transaksi Masuk</span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
              KAS MASUK
            </span>
          </div>
        </div>

        {/* Card 2: Pengeluaran Kas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-rose-400 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-start mb-3 relative">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran Kas ({getCategoryLabel()})</span>
              </span>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {getPeriodLabel()}
              </p>
            </div>
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-2">
            {formatRupiah(grandExpense)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-sans">{totalExpenseCount} Transaksi Keluar</span>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
              KAS KELUAR
            </span>
          </div>
        </div>

        {/* Card 3: Saldo Netto Kas Pusat */}
        <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-900 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden border border-teal-700">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-200" />
                <span>Laba Bersih & Saldo Netto</span>
              </span>
              <p className="text-[10px] text-teal-100 font-sans mt-0.5">
                Hasil bersih operasional ({getPeriodLabel()})
              </p>
            </div>
            <span className="bg-emerald-400 text-teal-950 font-black text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 shadow-sm shrink-0">
              KAS PUSAT
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight my-2 text-white">
            {formatRupiah(grandNet)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-teal-700/80 text-[11px]">
            <span className="text-teal-100 font-sans">Margin: <strong className="text-emerald-300">{netProfitMargin}%</strong></span>
            <span className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${grandNet >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
              {grandNet >= 0 ? 'SURPLUS NETTO' : 'DEFISIT NETTO'}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Official Report Document Layout */}
      <div
        id="audit-report-printable"
        className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8 font-mono print:border-none print:shadow-none print:p-0 print:bg-white"
      >
        {/* Printable Official Header */}
        <div className="border-b-2 border-red-600 pb-6 text-center space-y-2 relative">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-red-600 text-yellow-300 rounded-xl flex items-center justify-center font-black shadow-md border border-red-500">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 uppercase">LAPORAN KEUANGAN TIGA BERSAUDARA</span>
                <span className="bg-yellow-400 text-red-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">3 BERSAUDARA HQ</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">SISTEM INFORMASI LAPORAN KEUANGAN & PERFORMA KARYAWAN</p>
            </div>
          </div>
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wider uppercase pt-2">
            LAPORAN HARIAN DAN BULANAN TIGA BERSAUDARA
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 font-sans pt-1">
            <span className="flex items-center gap-1 font-mono font-bold bg-yellow-50 text-red-900 border border-yellow-200 px-3 py-1 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              KATEGORI: {getCategoryLabel().toUpperCase()}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-xl">
              PERIODE: {getPeriodLabel().toUpperCase()}
            </span>
            <span className="text-slate-300">•</span>
            <span>Total Transaksi: <strong className="text-slate-900">{reportTransactions.length} Log</strong></span>
            <span className="text-slate-300">•</span>
            <span>Waktu Cetak: <strong>{new Date().toLocaleString('id-ID')}</strong></span>
          </div>
        </div>

        {/* View Switcher & Search Bar (Hidden during printing) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100/80 rounded-2xl border border-slate-200/80 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveReportView('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportView === 'summary'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-teal-50'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Rekapitulasi Konsolidasi</span>
            </button>
            <button
              onClick={() => setActiveReportView('details')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportView === 'details'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-teal-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rincian Log Transaksi ({reportTransactions.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama/catatan..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>
        </div>

        {/* Audit Report Content Table */}
        {activeReportView === 'summary' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-teal-800 text-white font-bold uppercase tracking-wider">
                  <th className="p-3.5 border-b border-teal-700">Subjek / Kategori</th>
                  <th className="p-3.5 border-b border-teal-700 text-center">Total Log</th>
                  <th className="p-3.5 border-b border-teal-700 text-right text-emerald-300">
                    Pendapatan Keseluruhan
                  </th>
                  <th className="p-3.5 border-b border-teal-700 text-right text-rose-300">
                    Pengeluaran Keseluruhan
                  </th>
                  <th className="p-3.5 border-b border-teal-700 text-right">
                    Pendapatan Bersih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {/* Personnel Summary Rows (Shown if Category is ALL or personel) */}
                {(selectedCategory === 'ALL' || selectedCategory === 'personel') && (
                  <>
                    <tr className="bg-emerald-50/80 text-emerald-900 font-extrabold uppercase text-[10px] tracking-wider">
                      <td colSpan={5} className="p-3 border-b border-emerald-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>REKAPITULASI KARYAWAN PUSAT</span>
                      </td>
                    </tr>

                    {staffList.map((staff) => {
                      const logs = reportTransactions.filter((t) => t.name === staff);
                      if (selectedCategory === 'personel' && logs.length === 0) return null;

                      let inVal = 0,
                        outVal = 0;
                      logs.forEach((l) => {
                        inVal += l.income || 0;
                        outVal += l.expense || 0;
                      });
                      const net = inVal - outVal;

                      return (
                        <tr key={staff} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 border-b border-slate-100 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{staff}</span>
                          </td>
                          <td className="p-3 border-b border-slate-100 text-center text-slate-600 font-sans">
                            {logs.length} Log
                          </td>
                          <td className="p-3 border-b border-slate-100 text-right text-emerald-700 font-bold">
                            {inVal > 0 ? formatRupiah(inVal) : '-'}
                          </td>
                          <td className="p-3 border-b border-slate-100 text-right text-rose-600 font-bold">
                            {outVal > 0 ? formatRupiah(outVal) : '-'}
                          </td>
                          <td
                            className={`p-3 border-b border-slate-100 text-right font-black ${
                              net >= 0 ? 'text-slate-900' : 'text-rose-600'
                            }`}
                          >
                            {formatRupiah(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}

                {/* Sembako & Logistik Rows (Shown if Category is ALL or logistik) */}
                {(selectedCategory === 'ALL' || selectedCategory === 'logistik') && (
                  <>
                    <tr className="bg-amber-100 text-amber-950 font-extrabold uppercase text-[10px] tracking-wider">
                      <td colSpan={5} className="p-3 border-b border-amber-200">
                        🛒 RINCIAN PENGELUARAN SEMBAKO & LOGISTIK
                      </td>
                    </tr>

                    {(() => {
                      const sembakoLogs = reportTransactions.filter(isSembakoTx);
                      if (sembakoLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-3 text-slate-400 italic font-sans text-center">
                              Tidak ada catatan pengeluaran sembako & logistik pada periode ini.
                            </td>
                          </tr>
                        );
                      }

                      let sembakoTotalExp = 0;
                      sembakoLogs.forEach((l) => (sembakoTotalExp += l.expense || 0));

                      return (
                        <>
                          {sembakoLogs.map((tx) => (
                            <tr key={tx.id} className="hover:bg-amber-50/50 transition-colors">
                              <td className="p-3 border-b border-slate-100 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{tx.name}</span>
                                </div>
                                {tx.note && (
                                  <p className="text-[10px] font-sans text-slate-500 mt-0.5 ml-5">
                                    {tx.note}
                                  </p>
                                )}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-center text-slate-500 font-sans text-[11px]">
                                {tx.date}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right text-slate-400 font-sans">
                                -
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right text-amber-800 font-extrabold">
                                {formatRupiah(tx.expense)}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right font-bold text-slate-700">
                                -{formatRupiah(tx.expense)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-amber-50 font-black text-amber-950 text-xs">
                            <td colSpan={3} className="p-3 border-b border-amber-200 text-right uppercase">
                              SUBTOTAL BELANJA SEMBAKO ({sembakoLogs.length} LOG):
                            </td>
                            <td className="p-3 border-b border-amber-200 text-right text-amber-900">
                              {formatRupiah(sembakoTotalExp)}
                            </td>
                            <td className="p-3 border-b border-amber-200 text-right text-amber-900">
                              -{formatRupiah(sembakoTotalExp)}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Operasional Rows (Shown if Category is ALL or layanan) */}
                {(selectedCategory === 'ALL' || selectedCategory === 'layanan') && (
                  <>
                    <tr className="bg-blue-100 text-blue-950 font-extrabold uppercase text-[10px] tracking-wider">
                      <td colSpan={5} className="p-3 border-b border-blue-200">
                        ⚙️ RINCIAN PENGELUARAN LAYANAN & OPERASIONAL
                      </td>
                    </tr>

                    {(() => {
                      const operasionalLogs = reportTransactions.filter(isOperasionalTx);
                      if (operasionalLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-3 text-slate-400 italic font-sans text-center">
                              Tidak ada catatan pengeluaran operasional & layanan pada periode ini.
                            </td>
                          </tr>
                        );
                      }

                      let opTotalExp = 0;
                      operasionalLogs.forEach((l) => (opTotalExp += l.expense || 0));

                      return (
                        <>
                          {operasionalLogs.map((tx) => (
                            <tr key={tx.id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="p-3 border-b border-slate-100 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{tx.name}</span>
                                </div>
                                {tx.note && (
                                  <p className="text-[10px] font-sans text-slate-500 mt-0.5 ml-5">
                                    {tx.note}
                                  </p>
                                )}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-center text-slate-500 font-sans text-[11px]">
                                {tx.date}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right text-slate-400 font-sans">
                                -
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right text-blue-800 font-extrabold">
                                {formatRupiah(tx.expense)}
                              </td>
                              <td className="p-3 border-b border-slate-100 text-right font-bold text-slate-700">
                                -{formatRupiah(tx.expense)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-blue-50 font-black text-blue-950 text-xs">
                            <td colSpan={3} className="p-3 border-b border-blue-200 text-right uppercase">
                              SUBTOTAL BIAYA OPERASIONAL ({operasionalLogs.length} LOG):
                            </td>
                            <td className="p-3 border-b border-blue-200 text-right text-blue-900">
                              {formatRupiah(opTotalExp)}
                            </td>
                            <td className="p-3 border-b border-blue-200 text-right text-blue-900">
                              -{formatRupiah(opTotalExp)}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-teal-900 text-white font-black text-xs uppercase tracking-wider">
                  <td className="p-4 border-t border-teal-800">TOTAL LAPORAN AUDIT</td>
                  <td className="p-4 border-t border-teal-800 text-center font-sans">
                    {reportTransactions.length} Record
                  </td>
                  <td className="p-4 border-t border-teal-800 text-right text-emerald-300">
                    {formatRupiah(grandIncome)}
                  </td>
                  <td className="p-4 border-t border-teal-800 text-right text-rose-300">
                    {formatRupiah(grandExpense)}
                  </td>
                  <td className="p-4 border-t border-teal-800 text-right text-white">
                    {formatRupiah(grandNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Detailed Transaction Log Table */
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-teal-800 text-white font-bold uppercase tracking-wider">
                  <th className="p-3 border-b border-teal-700">No</th>
                  <th className="p-3 border-b border-teal-700">Tanggal</th>
                  <th className="p-3 border-b border-teal-700">Kategori</th>
                  <th className="p-3 border-b border-teal-700">Subjek / Karyawan</th>
                  <th className="p-3 border-b border-teal-700">Catatan</th>
                  <th className="p-3 border-b border-teal-700 text-right text-emerald-300">Masuk</th>
                  <th className="p-3 border-b border-teal-700 text-right text-rose-300">Keluar</th>
                  <th className="p-3 border-b border-teal-700 text-right">Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                      Tidak ada data log transaksi yang sesuai dengan pilihan cetak laporan ini.
                    </td>
                  </tr>
                ) : (
                  reportTransactions.map((t, idx) => {
                    const inc = t.income || 0;
                    const exp = t.expense || 0;
                    const net = inc - exp;

                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-sans text-center">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{t.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{t.name}</td>
                        <td className="p-3 text-slate-600 font-sans text-[11px]">{t.note || '-'}</td>
                        <td className="p-3 text-right text-emerald-700 font-bold">
                          {inc > 0 ? formatRupiah(inc) : '-'}
                        </td>
                        <td className="p-3 text-right text-rose-600 font-bold">
                          {exp > 0 ? formatRupiah(exp) : '-'}
                        </td>
                        <td className={`p-3 text-right font-black ${net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                          {formatRupiah(net)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-teal-900 text-white font-black text-xs uppercase">
                  <td colSpan={5} className="p-4 text-left">
                    TOTAL DISARING ({reportTransactions.length} LOG)
                  </td>
                  <td className="p-4 text-right text-emerald-300">
                    {formatRupiah(reportTransactions.reduce((acc, t) => acc + (t.income || 0), 0))}
                  </td>
                  <td className="p-4 text-right text-rose-300">
                    {formatRupiah(reportTransactions.reduce((acc, t) => acc + (t.expense || 0), 0))}
                  </td>
                  <td className="p-4 text-right text-white">
                    {formatRupiah(
                      reportTransactions.reduce(
                        (acc, t) => acc + (t.income || 0) - (t.expense || 0),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Printable Verification Footer */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="font-bold text-slate-500 uppercase">Petugas Audit Keuangan</p>
            <div className="h-16 border-b border-slate-300 my-2" />
            <p className="font-extrabold text-slate-900">ADMINISTRATOR KEUANGAN</p>
          </div>
          <div>
            <p className="font-bold text-slate-500 uppercase">Mengetahui / Pimpinan</p>
            <div className="h-16 border-b border-slate-300 my-2" />
            <p className="font-extrabold text-slate-900">DIREKSI KEUANGAN</p>
          </div>
        </div>
      </div>

      {/* Reset Database Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 font-mono">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/60 relative text-center">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 uppercase">
              Konfirmasi Reset Database
            </h3>

            <p className="text-xs text-slate-600 font-sans mt-2 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>seluruh {transactions.length} record transaksi lokal</strong> dan mereset daftar nama karyawan kembali ke standar awal? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 bg-white/60 hover:bg-white/90 border border-white/60 text-slate-700 py-3.5 rounded-2xl font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
