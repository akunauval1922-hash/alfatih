import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah, isSembakoTx, isOperasionalTx } from '../lib/storage';
import { FinancialAnalyticsChart } from './FinancialAnalyticsChart';
import { AppLogo } from './AppLogo';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  CloudOff,
  Cloud,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  ShoppingBag,
  Wrench,
  ListFilter,
  Layers,
  X,
  Database,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';

interface DashboardTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (tx: Transaction) => void;
  onGoToInput: () => void;
  hasGoogleScript?: boolean;
  unsyncedCount?: number;
  onSyncUnsynced?: () => Promise<number>;
  onRefreshToDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
  onUpdateFromDatabase?: () => Promise<{ count: number; success: boolean; msg: string }>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  onGoToInput,
  hasGoogleScript = false,
  unsyncedCount = 0,
  onSyncUnsynced,
  onRefreshToDatabase,
  onUpdateFromDatabase
}) => {
  const [sortField, setSortField] = useState<'date' | 'income' | 'expense'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'sembako' | 'operasional' | 'personel'>('ALL');
  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handlePushToDatabase = async () => {
    if (!onRefreshToDatabase) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await onRefreshToDatabase();
    setIsSyncing(false);
    setSyncFeedback(res.msg);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handlePullFromDatabase = async () => {
    if (!onUpdateFromDatabase) return;
    setIsPulling(true);
    setSyncFeedback(null);
    const res = await onUpdateFromDatabase();
    setIsPulling(false);
    setSyncFeedback(res.msg);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Compute KPI metrics
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    totalIncome += tx.income || 0;
    totalExpense += tx.expense || 0;
  });
  const netBalance = totalIncome - totalExpense;

  // Sembako & Operasional Metrics
  const sembakoTxs = transactions.filter(isSembakoTx);
  const operasionalTxs = transactions.filter(isOperasionalTx);
  const personelTxs = transactions.filter((t) => !isSembakoTx(t) && !isOperasionalTx(t));

  const totalSembakoExpense = sembakoTxs.reduce((sum, t) => sum + (t.expense || 0), 0);
  const totalOperasionalExpense = operasionalTxs.reduce((sum, t) => sum + (t.expense || 0), 0);

  // Category Filtering for table
  const displayedTransactions = transactions.filter((t) => {
    if (activeCategoryFilter === 'sembako') return isSembakoTx(t);
    if (activeCategoryFilter === 'operasional') return isOperasionalTx(t);
    if (activeCategoryFilter === 'personel') return !isSembakoTx(t) && !isOperasionalTx(t);
    return true;
  });

  // Sorting
  const sortedTransactions = [...displayedTransactions].sort((a, b) => {
    if (sortField === 'date') {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    } else if (sortField === 'income') {
      return sortOrder === 'desc' ? b.income - a.income : a.income - b.income;
    } else {
      return sortOrder === 'desc' ? b.expense - a.expense : a.expense - b.expense;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-600/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-red-500">
        <div className="flex items-center gap-4 z-10">
          <AppLogo size="lg" />
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold font-sans tracking-tight text-white uppercase flex items-center gap-2">
              SYSTEM LAPORAN TIGA BERSAUDARA
            </h2>
            <p className="text-xs text-red-100 font-mono uppercase tracking-tight leading-relaxed max-w-xl">
              MONITOR PENDAPATAN KOTOR, PENGELUARAN OPERASIONAL & PENGELUARAN KARYAWAN TERINTEGRASI SISTEM KONTROL
            </p>
          </div>
        </div>

        <button
          onClick={onGoToInput}
          className="z-10 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-red-950 font-mono font-black text-xs px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer border border-yellow-300"
        >
          <Plus className="w-4 h-4 text-red-950" />
          <span>+ TRANSAKSI BARU</span>
        </button>

        {/* Decorative yellow circle glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Cloud Sync Quick Bar */}
      {hasGoogleScript && unsyncedCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-yellow-900 font-mono text-xs shadow-sm">
          <div className="flex items-center space-x-2.5">
            <CloudOff className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Ada {unsyncedCount} transaksi belum tersimpan di Sistem Kontrol!</span>
              <p className="text-[11px] text-yellow-800/80 font-sans">
                Pendapatan, pengeluaran & total hasil transaksi ini berada di penyimpanan lokal.
              </p>
            </div>
          </div>
          <button
            onClick={handlePushToDatabase}
            disabled={isSyncing}
            className="bg-red-600 hover:bg-red-700 text-yellow-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync ke Cloud Now'}</span>
          </button>
        </div>
      )}

      {syncFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 font-mono text-xs flex items-center space-x-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{syncFeedback}</span>
        </div>
      )}

      {/* Main Financial KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              Pendapatan Keseluruhan
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
            {formatRupiah(totalIncome)}
          </h3>
          <div className="mt-3 flex items-center space-x-2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 inline-flex px-2.5 py-1 rounded-lg">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>AKUMULASI KAS MASUK</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              Pengeluaran Keseluruhan
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black font-mono text-rose-700 tracking-tight">
            {formatRupiah(totalExpense)}
          </h3>
          <div className="mt-3 flex items-center space-x-2 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-100 inline-flex px-2.5 py-1 rounded-lg">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>KARYAWAN + SEMBAKO + OPERASIONAL</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-red-600 rounded-2xl p-6 shadow-lg shadow-red-600/10 text-white relative overflow-hidden group border border-red-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-yellow-300 font-mono uppercase tracking-wider">
              Laba Bersih / Saldo Kas
            </span>
            <div
              className={`p-2.5 rounded-xl transition-colors bg-yellow-400 text-red-950 font-bold`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3
            className={`text-2xl font-black font-mono tracking-tight text-white`}
          >
            {formatRupiah(netBalance)}
          </h3>
          <div
            className={`mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-yellow-400 text-red-950`}
          >
            <span>{netBalance >= 0 ? 'KAS SURPLUS' : 'DEFISIT PENGELUARAN'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Financial Analytics Chart */}
      <FinancialAnalyticsChart transactions={transactions} />

      {/* RINCIAN PENGELUARAN SEMBAKO & OPERASIONAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
        {/* Card 1: Rincian Pengeluaran Sembako & Logistik */}
        <div
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'sembako' ? 'ALL' : 'sembako')}
          className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeCategoryFilter === 'sembako'
              ? 'border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/20'
              : 'border-amber-200/80 hover:border-amber-400'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-bold">
                <ShoppingBag className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                  <span>Rincian Pengeluaran Sembako & Logistik</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">
                  Pembelian konsumsi, beras, minyak & stok sembako
                </p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-amber-300">
              {sembakoTxs.length} Log Item
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-sans">Total Belanja Sembako:</span>
            <span className="text-xl font-black text-amber-800">
              {formatRupiah(totalSembakoExpense)}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-900 font-bold font-sans">
              {activeCategoryFilter === 'sembako' ? '✓ Menampilkan Rincian Sembako' : '👉 Klik untuk lihat rincian lengkap'}
            </span>
            <span className="text-amber-800 font-black text-[10px] bg-amber-100 px-2 py-0.5 rounded-lg">
              {activeCategoryFilter === 'sembako' ? 'AKTIF' : 'LIHAT DETAIL'}
            </span>
          </div>
        </div>

        {/* Card 2: Rincian Pengeluaran Operasional & Layanan */}
        <div
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'operasional' ? 'ALL' : 'operasional')}
          className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeCategoryFilter === 'operasional'
              ? 'border-blue-500 ring-2 ring-blue-400/30 bg-blue-50/20'
              : 'border-blue-200/80 hover:border-blue-400'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl font-bold">
                <Wrench className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                  <span>Rincian Pengeluaran Operasional & Layanan</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">
                  Bensin, tol, service armada, armada & operasional harian
                </p>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-blue-300">
              {operasionalTxs.length} Log Item
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-sans">Total Biaya Operasional:</span>
            <span className="text-xl font-black text-blue-800">
              {formatRupiah(totalOperasionalExpense)}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-900 font-bold font-sans">
              {activeCategoryFilter === 'operasional' ? '✓ Menampilkan Rincian Operasional' : '👉 Klik untuk lihat rincian lengkap'}
            </span>
            <span className="text-blue-800 font-black text-[10px] bg-blue-100 px-2 py-0.5 rounded-lg">
              {activeCategoryFilter === 'operasional' ? 'AKTIF' : 'LIHAT DETAIL'}
            </span>
          </div>
        </div>
      </div>

      {/* Log Transaksi Terkini Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Table Header & Category Tabs */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-600" />
              <h3 className="font-mono font-black text-xs uppercase tracking-wider text-slate-800">
                Tabel Rincian Transaksi ({sortedTransactions.length} Log Tampil)
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="text-slate-400">Urutkan:</span>
              <button
                onClick={() => {
                  setSortField('date');
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-1 rounded-xl border transition-colors cursor-pointer ${
                  sortField === 'date'
                    ? 'bg-red-600 text-yellow-300 border-red-600 font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tanggal {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>
            </div>
          </div>

          {/* Quick Filter Bar for Categories */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
            <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1 mr-1">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Saring Rincian:</span>
            </span>

            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Transaksi ({transactions.length})
            </button>

            <button
              onClick={() => setActiveCategoryFilter('sembako')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                activeCategoryFilter === 'sembako'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🛒 Rincian Sembako ({sembakoTxs.length})</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('operasional')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                activeCategoryFilter === 'operasional'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>⚙️ Rincian Operasional ({operasionalTxs.length})</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('personel')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                activeCategoryFilter === 'personel'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              👤 Karyawan ({personelTxs.length})
            </button>
          </div>

          {/* Anti-Wrong Input Safety Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/90 text-emerald-950 border border-emerald-300 rounded-xl text-[11px] font-mono font-bold shadow-xs">
            <span>🛡️ Aman Salah Input:</span>
            <span className="font-sans font-normal text-slate-700">Gunakan Edit (✏️) atau Hapus (🗑️) jika ada kekeliruan data.</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Subjek / Karyawan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Masuk (IDR)</th>
                <th className="p-4 text-right">Keluar (IDR)</th>
                <th className="p-4 text-right">Netto</th>
                <th className="p-4 text-center">Sync</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const diff = tx.income - tx.expense;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-700 whitespace-nowrap">{tx.date}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{tx.name}</div>
                        {tx.note && (
                          <div className="text-[10px] text-slate-500 font-sans max-w-xs truncate">
                            {tx.note}
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4 text-right text-emerald-700 font-bold whitespace-nowrap">
                        {tx.income > 0 ? formatRupiah(tx.income) : '-'}
                      </td>
                      <td className="p-4 text-right text-rose-600 font-bold whitespace-nowrap">
                        {tx.expense > 0 ? formatRupiah(tx.expense) : '-'}
                      </td>
                      <td
                        className={`p-4 text-right font-black whitespace-nowrap ${
                          diff >= 0 ? 'text-slate-900' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(diff)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {tx.syncedToCloud ? (
                          <span
                            className="inline-flex items-center text-emerald-600"
                            title="Tersimpan di Sistem Kontrol"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-amber-500"
                            title="Tersimpan di LocalStorage"
                          >
                            <CloudOff className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap space-x-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white/80 rounded-xl transition-colors"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Transaction Confirmation Modal */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 font-mono">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-sm w-full p-6 shadow-2xl border border-white/60 relative text-center">
            <button
              onClick={() => setDeletingTxId(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 uppercase">
              Hapus Transaksi?
            </h3>

            <p className="text-xs text-slate-600 font-sans mt-2 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingTxId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(deletingTxId);
                  setDeletingTxId(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
