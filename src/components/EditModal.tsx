import React, { useState } from 'react';
import { Transaction } from '../types';
import { X, Save } from 'lucide-react';
import { sanitizeText, sanitizeNumber } from '../lib/storage';

interface EditModalProps {
  transaction: Transaction;
  staffList: string[];
  onSave: (updated: Transaction) => void;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  transaction,
  staffList,
  onSave,
  onClose
}) => {
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [name, setName] = useState(transaction.name);
  const [income, setIncome] = useState(transaction.income.toString());
  const [expense, setExpense] = useState(transaction.expense.toString());
  const [note, setNote] = useState(transaction.note || '');

  const isExpenseOnly =
    category === 'logistik' ||
    category === 'layanan' ||
    name.toUpperCase().includes('SEMBAKO') ||
    name.toUpperCase().includes('OPERASIONAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...transaction,
      date: date || new Date().toISOString().split('T')[0],
      category: sanitizeText(category, 50),
      name: sanitizeText(name, 100),
      income: isExpenseOnly ? 0 : sanitizeNumber(parseFloat(income)),
      expense: sanitizeNumber(parseFloat(expense)),
      note: sanitizeText(note, 250)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 font-mono">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase">
            Edit Transaksi ID #{transaction.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1 flex justify-between">
              <span>Tanggal</span>
              <span className="text-slate-400 font-normal lowercase">semua tanggal diperbolehkan</span>
            </label>
            <input
              type="date"
              required
              min="1900-01-01"
              max="2099-12-31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Subjek / Nama Karyawan
            </label>
            {category === 'personel' ? (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  list="edit-modal-staff-list"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ketik nama karyawan..."
                  className="w-full p-3 bg-white/80 border border-emerald-300 rounded-2xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <datalist id="edit-modal-staff-list">
                  {staffList.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>
            ) : (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-white/50 border border-white/60 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/90"
              />
            )}
          </div>

          {isExpenseOnly ? (
            <div>
              <label className="block text-[10px] font-bold uppercase text-rose-700 mb-1">
                Pengeluaran / Keluar (IDR) - [Khusus Pengeluaran]
              </label>
              <input
                type="number"
                value={expense}
                onChange={(e) => setExpense(e.target.value)}
                className="w-full p-3 bg-white/70 border border-rose-200/80 rounded-2xl text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Pendapatan (IDR)
                </label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full p-3 bg-white/50 border border-white/60 rounded-2xl text-xs font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/90"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Pengeluaran (IDR)
                </label>
                <input
                  type="number"
                  value={expense}
                  onChange={(e) => setExpense(e.target.value)}
                  className="w-full p-3 bg-white/50 border border-white/60 rounded-2xl text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/90"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1 flex justify-between items-center">
              <span>Catatan / Keterangan Koreksi</span>
              <span className="text-emerald-700 text-[10px]">🛡️ Aman Diperbarui</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan rincian atau keterangan koreksi..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {/* Quick Correction Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 font-mono flex items-center">Label Cepat:</span>
              <button
                type="button"
                onClick={() => setNote((prev) => prev ? `${prev} (Koreksi Input)` : 'Koreksi Input')}
                className="px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-[10px] font-mono font-bold rounded-lg border border-yellow-200 transition-all cursor-pointer"
              >
                + Koreksi Input
              </button>
              <button
                type="button"
                onClick={() => setNote((prev) => prev ? `${prev} (Revisi Nominal)` : 'Revisi Nominal')}
                className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold rounded-lg border border-emerald-200 transition-all cursor-pointer"
              >
                + Revisi Nominal
              </button>
              <button
                type="button"
                onClick={() => setNote((prev) => prev ? `${prev} (Koreksi Tanggal)` : 'Koreksi Tanggal')}
                className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-900 text-[10px] font-mono font-bold rounded-lg border border-sky-200 transition-all cursor-pointer"
              >
                + Koreksi Tanggal
              </button>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/50 hover:bg-white/80 border border-white/60 text-slate-700 py-3 rounded-2xl font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
