import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah, sanitizeText, sanitizeNumber } from '../lib/storage';
import {
  PlusCircle,
  Calendar,
  User,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Coins,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

interface InputTabProps {
  staffList: string[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<boolean>;
  hasGoogleScript: boolean;
  onAddStaff?: (name: string) => void;
}

export const InputTab: React.FC<InputTabProps> = ({
  staffList,
  onAddTransaction,
  hasGoogleScript,
  onAddStaff
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('personel');
  const [staffInputName, setStaffInputName] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [income, setIncome] = useState<string>('');
  const [expense, setExpense] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const isExpenseOnly = category === 'logistik' || category === 'layanan';

  // Quick nominal helper
  const addAmountToField = (field: 'income' | 'expense', addVal: number) => {
    if (field === 'income') {
      const current = parseFloat(income) || 0;
      setIncome((current + addVal).toString());
    } else {
      const current = parseFloat(expense) || 0;
      setExpense((current + addVal).toString());
    }
  };

  const setExactAmount = (field: 'income' | 'expense', exactVal: number) => {
    if (field === 'income') {
      setIncome(exactVal.toString());
    } else {
      setExpense(exactVal.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    let nameToUse = '';
    if (category === 'personel') {
      nameToUse = staffInputName.trim().toUpperCase();
      if (!nameToUse) {
        setNotification({
          type: 'error',
          msg: 'Harap ketik nama karyawan.'
        });
        setIsSubmitting(false);
        return;
      }
      if (onAddStaff && !staffList.includes(nameToUse)) {
        onAddStaff(nameToUse);
      }
    } else if (category === 'logistik') {
      nameToUse = customSubject.trim().toUpperCase() || 'SEMBAKO & LOGISTIK';
    } else if (category === 'layanan') {
      nameToUse = customSubject.trim().toUpperCase() || 'OPERASIONAL & LAYANAN';
    } else {
      nameToUse = customSubject.trim().toUpperCase() || category.toUpperCase();
    }

    const incVal = isExpenseOnly ? 0 : parseFloat(income) || 0;
    const expVal = parseFloat(expense) || 0;

    if (isExpenseOnly && expVal === 0) {
      setNotification({
        type: 'error',
        msg: 'Isi nominal Pengeluaran (Keluar) untuk Sembako / Operasional.'
      });
      setIsSubmitting(false);
      return;
    }

    if (!isExpenseOnly && incVal === 0 && expVal === 0) {
      setNotification({
        type: 'error',
        msg: 'Isi nilai Pendapatan (Masuk) atau Pengeluaran (Keluar).'
      });
      setIsSubmitting(false);
      return;
    }

    const newTx: Omit<Transaction, 'id'> = {
      date: date || new Date().toISOString().split('T')[0],
      category: sanitizeText(category, 50),
      name: sanitizeText(nameToUse, 100),
      income: sanitizeNumber(incVal),
      expense: sanitizeNumber(expVal),
      note: sanitizeText(note, 250)
    };

    // Instant local save (0ms response)
    await onAddTransaction(newTx);

    setIsSubmitting(false);
    setNotification({
      type: 'success',
      msg: '✅ Transaksi berhasil disimpan! Data langsung tercatat di sistem.'
    });

    // Reset numeric inputs & note for fast consecutive data entry
    setIncome('');
    setExpense('');
    setNote('');
  };

  // Preset note chips
  const noteSuggestions = category === 'personel'
    ? ['Setoran harian', 'Kasbon karyawan', 'Gaji / Honorarium', 'Setoran rit']
    : category === 'logistik'
    ? ['Pembelian beras & kebutuhan', 'Stok sembako toko', 'Konsumsi harian karyawan']
    : ['Biaya bensin & tol', 'Servis rutin armada', 'Operasional lapangan', 'Perbaikan alat'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Main Input Form Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-md border border-slate-200/90 relative overflow-hidden">
        {/* Subtle Decorative Gradient Backdrop Bar */}
        <div className={`absolute top-0 left-0 right-0 h-2 transition-all duration-300 ${
          category === 'personel'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
            : category === 'logistik'
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
            : 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
        }`} />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl shadow-sm transition-colors ${
              category === 'personel'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                : category === 'logistik'
                ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                : 'bg-rose-50 text-rose-600 border border-rose-200/60'
            }`}>
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  Input Transaksi Keuangan
                </h2>
                <span className="bg-slate-900 text-yellow-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black tracking-wider uppercase">
                  3 BERSAUDARA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Pencatatan data transaksi harian secara cepat, rapi, dan otomatis terhitung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 self-start sm:self-center">
            <span className="text-[11px] font-mono font-bold text-slate-500 px-2">Mode:</span>
            <span className={`text-[11px] font-mono font-black px-3 py-1 rounded-xl uppercase shadow-2xs ${
              category === 'personel'
                ? 'bg-emerald-600 text-white'
                : category === 'logistik'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {category === 'personel' ? 'Karyawan' : category === 'logistik' ? 'Logistik' : 'Operasional'}
            </span>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="mt-6">
          <label className="block text-[11px] font-black uppercase text-slate-500 font-mono mb-2.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-700" />
            <span>Pilih Jenis Transaksi</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Personel Button */}
            <button
              type="button"
              onClick={() => {
                setCategory('personel');
                setCustomSubject('');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-3 ${
                category === 'personel'
                  ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                category === 'personel' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}>
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono ${category === 'personel' ? 'text-emerald-950' : 'text-slate-800'}`}>
                    Input Karyawan
                  </span>
                  {category === 'personel' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                  Setoran harian, kasbon & honor
                </p>
              </div>
            </button>

            {/* Logistik Button */}
            <button
              type="button"
              onClick={() => {
                setCategory('logistik');
                setIncome('');
                if (!customSubject || customSubject === 'OPERASIONAL & LAYANAN') {
                  setCustomSubject('SEMBAKO & LOGISTIK');
                }
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-3 ${
                category === 'logistik'
                  ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                category === 'logistik' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}>
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono ${category === 'logistik' ? 'text-amber-950' : 'text-slate-800'}`}>
                    Sembako & Logistik
                  </span>
                  {category === 'logistik' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                  Belanja beras, stok & konsumsi
                </p>
              </div>
            </button>

            {/* Operasional Button */}
            <button
              type="button"
              onClick={() => {
                setCategory('layanan');
                setIncome('');
                if (!customSubject || customSubject === 'SEMBAKO & LOGISTIK') {
                  setCustomSubject('OPERASIONAL & LAYANAN');
                }
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-3 ${
                category === 'layanan'
                  ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/30 shadow-sm'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                category === 'layanan' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}>
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono ${category === 'layanan' ? 'text-rose-950' : 'text-slate-800'}`}>
                    Operasional
                  </span>
                  {category === 'layanan' && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                  Bensin, tol, servis & armada
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`mt-5 p-4 rounded-2xl flex items-center space-x-3 text-xs font-mono border shadow-2xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{notification.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Row 1: Date Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 font-mono mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tanggal Transaksi</span>
                </span>
                <span className="text-[10px] text-slate-400 font-sans">Semua tanggal berlaku</span>
              </label>
              <input
                type="date"
                required
                min="1900-01-01"
                max="2099-12-31"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Category Indicator Info Box */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Status Alokasi Data</span>
                <span className="text-xs font-black font-mono text-slate-900 block">
                  {category === 'personel' ? 'Pendapatan & Beban Karyawan' : category === 'logistik' ? 'Beban Pengeluaran Logistik' : 'Beban Pengeluaran Operasional'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Coins className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>

          {/* Row 2: Subject / Employee Name */}
          {category === 'personel' ? (
            <div className="space-y-3 bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-black uppercase text-emerald-950 font-mono flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Nama Karyawan</span>
                </label>
                {staffList.length > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {staffList.length} Nama Tersimpan
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  list="staff-autocomplete-list"
                  value={staffInputName}
                  onChange={(e) => setStaffInputName(e.target.value)}
                  placeholder="Ketik nama karyawan (Contoh: BUDI / AHMAD / Bebas)..."
                  className="w-full p-4 bg-white border-2 border-emerald-300 focus:border-emerald-600 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-sans"
                />
                <datalist id="staff-autocomplete-list">
                  {staffList.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>

              {staffList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-emerald-800 font-mono font-bold block">Pilih Cepat Nama Tersimpan:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {staffList.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStaffInputName(st)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          staffInputName.toUpperCase() === st.toUpperCase()
                            ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/30'
                            : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100/60'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-emerald-900 font-sans font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bebas ketik nama karyawan apa saja. Nama otomatis tersimpan di sistem & dapat diakses kembali kapan pun.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <label className="block text-[11px] font-black uppercase text-slate-700 font-mono flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-600" />
                <span>Subjek / Keterangan Transaksi ({category === 'layanan' ? 'Operasional' : 'Sembako & Logistik'})</span>
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder={
                  category === 'layanan'
                    ? 'Contoh: OPERASIONAL & LAYANAN / BENSIN & TOL / SERVICE ARMADA...'
                    : 'Contoh: SEMBAKO & LOGISTIK / BERAS & KONSUMSI...'
                }
                className="w-full p-4 bg-white border border-slate-200 focus:border-slate-400 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Row 3: Income & Expense Inputs */}
          {isExpenseOnly ? (
            <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-rose-950 font-mono flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>Nominal Pengeluaran / Keluar (IDR)</span>
                </label>
                {expense && (
                  <span className="text-xs font-black font-mono text-rose-700 bg-white px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
                    {formatRupiah(parseFloat(expense) || 0)}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Masukkan nominal (Contoh: 150000)"
                  required
                  value={expense}
                  onChange={(e) => setExpense(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-rose-300 focus:border-rose-600 rounded-2xl text-base sm:text-lg font-mono font-black text-rose-950 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-2xs"
                />
              </div>

              {/* Quick Nominal Shortcut Chips */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-800">Pintasan Nominal Tambahan:</span>
                  {expense && (
                    <button
                      type="button"
                      onClick={() => setExpense('')}
                      className="text-[10px] font-mono font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Bersihkan</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[50000, 100000, 250000, 500000, 1000000, 2000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => addAmountToField('expense', amt)}
                      className="px-3 py-1.5 bg-white hover:bg-rose-100/80 text-rose-900 border border-rose-200 rounded-xl text-[11px] font-mono font-bold transition-all shadow-2xs cursor-pointer hover:border-rose-300 active:scale-95"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000}JT` : `${amt / 1000}RB`}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-mono text-rose-800 font-medium pt-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Transaksi ini otomatis dikelompokkan sebagai Pengeluaran (Keluar).</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Income Field */}
              <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-emerald-950 font-mono flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Pendapatan / Masuk (IDR)</span>
                  </label>
                  {income && (
                    <span className="text-xs font-black font-mono text-emerald-700 bg-white px-2.5 py-0.5 rounded-xl border border-emerald-200 shadow-2xs">
                      {formatRupiah(parseFloat(income) || 0)}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0 (Jumlah Masuk)"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full p-3.5 bg-white border border-emerald-300 focus:border-emerald-600 rounded-2xl text-sm font-mono font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                />

                {/* Quick Chips for Income */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">Tambah Nominal:</span>
                    {income && (
                      <button
                        type="button"
                        onClick={() => setIncome('')}
                        className="text-[10px] font-mono font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Bersihkan</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[100000, 500000, 1000000, 1500000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => addAmountToField('income', amt)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-mono font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        +{amt >= 1000000 ? `${amt / 1000000}JT` : `${amt / 1000}RB`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expense Field */}
              <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-rose-950 font-mono flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span>Pengeluaran / Keluar (IDR)</span>
                  </label>
                  {expense && (
                    <span className="text-xs font-black font-mono text-rose-700 bg-white px-2.5 py-0.5 rounded-xl border border-rose-200 shadow-2xs">
                      {formatRupiah(parseFloat(expense) || 0)}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0 (Jumlah Keluar)"
                  value={expense}
                  onChange={(e) => setExpense(e.target.value)}
                  className="w-full p-3.5 bg-white border border-rose-300 focus:border-rose-600 rounded-2xl text-sm font-mono font-bold text-rose-950 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-2xs"
                />

                {/* Quick Chips for Expense */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-rose-800">Tambah Nominal:</span>
                    {expense && (
                      <button
                        type="button"
                        onClick={() => setExpense('')}
                        className="text-[10px] font-mono font-bold text-slate-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Bersihkan</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => addAmountToField('expense', amt)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-[10px] font-mono font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        +{amt >= 1000000 ? `${amt / 1000000}JT` : `${amt / 1000}RB`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Note */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-slate-700 font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Catatan / Rincian Keterangan</span>
              </span>
              <span className="text-[10px] text-slate-400 font-sans">Opsional</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Rincian biaya bensin, tol, sembako, atau setoran rit harian..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-2xs"
            />

            {/* Quick Note Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-mono font-medium">Contoh rincian:</span>
              {noteSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNote(sug)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button & Safety Notice */}
          <div className="pt-3 space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-mono text-xs font-black shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] ${
                category === 'personel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 border border-emerald-500'
                  : category === 'logistik'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 border border-amber-500'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 border border-rose-500'
              }`}
            >
              <Send className="w-4 h-4 text-white" />
              <span>⚡ SIMPAN TRANSAKSI SEKARANG</span>
            </button>

            {/* Safety & Anti-Wrong Input Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-sans flex items-start space-x-3 shadow-2xs">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-extrabold font-mono text-[11px] text-slate-900 uppercase">
                  Aplikasi Fleksibel & Safe-Guard 100%
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Apabila terdapat kekeliruan nominal atau nama, Anda dapat mengedit, merevisi, atau menghapus transaksi kapan saja melalui menu <strong>Pusat Laporan</strong>. Seluruh perhitungan saldo dan rekap otomatis diperbarui secara presisi.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
