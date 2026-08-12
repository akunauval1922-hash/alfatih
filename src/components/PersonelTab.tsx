import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../lib/storage';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface PersonelTabProps {
  staffList: string[];
  transactions: Transaction[];
  onAddStaff: (name: string) => void;
  onRenameStaff: (oldName: string, newName: string) => void;
  onDeleteStaff: (name: string) => void;
}

export const PersonelTab: React.FC<PersonelTabProps> = ({
  staffList,
  transactions,
  onAddStaff,
  onRenameStaff,
  onDeleteStaff
}) => {
  const [searchStaff, setSearchStaff] = useState('');
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<string | null>(null);

  // Modal State for Staff Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');

  const [editingStaffName, setEditingStaffName] = useState<string | null>(null);
  const [editStaffValue, setEditStaffValue] = useState('');
  const [deletingStaffName, setDeletingStaffName] = useState<string | null>(null);

  const filteredStaff = staffList.filter((s) =>
    s.toLowerCase().includes(searchStaff.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName.trim()) {
      onAddStaff(newStaffName.trim().toUpperCase());
      setNewStaffName('');
      setIsAddModalOpen(false);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaffName && editStaffValue.trim()) {
      onRenameStaff(editingStaffName, editStaffValue.trim().toUpperCase());
      setEditingStaffName(null);
      setEditStaffValue('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <span>Informasi Karyawan & Staf</span>
            <span className="bg-yellow-400 text-red-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">3 BERSAUDARA</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Rekapitulasi pendapatan, pengeluaran & saldo harian ({staffList.length} Karyawan)
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchStaff}
              onChange={(e) => setSearchStaff(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 rounded-xl text-xs outline-none transition-all text-slate-800 placeholder-slate-400 font-sans"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-yellow-300 border border-red-500 px-4 py-2 rounded-xl text-xs font-mono font-black flex items-center space-x-1.5 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>+ Tambah Member</span>
          </button>
        </div>
      </div>

      {/* Overall Summary Cards for All Employees */}
      {(() => {
        const personnelTransactions = transactions.filter(
          (t) =>
            t.category === 'personel' ||
            staffList.some(
              (s) => s.trim().toUpperCase() === (t.name || '').trim().toUpperCase()
            )
        );
        const totalOverallIncome = personnelTransactions.reduce((acc, t) => acc + (t.income || 0), 0);
        const totalOverallExpense = personnelTransactions.reduce((acc, t) => acc + (t.expense || 0), 0);
        const totalOverallNet = totalOverallIncome - totalOverallExpense;

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Total Pendapatan Keseluruhan */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-[28px] p-5 shadow-lg shadow-emerald-600/15 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  Total Pendapatan Keseluruhan Karyawan
                </span>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {formatRupiah(totalOverallIncome)}
              </div>
              <p className="text-[10px] text-emerald-100/80 font-sans mt-1">
                Total akumulasi pendapatan seluruh {staffList.length} karyawan
              </p>
            </div>

            {/* Total Pengeluaran Keseluruhan */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-[28px] p-5 shadow-lg shadow-rose-600/15 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">
                  Total Pengeluaran Keseluruhan Karyawan
                </span>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {formatRupiah(totalOverallExpense)}
              </div>
              <p className="text-[10px] text-rose-100/80 font-sans mt-1">
                Total akumulasi pengeluaran seluruh {staffList.length} karyawan
              </p>
            </div>

            {/* Total Saldo Netto Keseluruhan */}
            <div className="bg-gradient-to-br from-teal-800 to-emerald-900 text-white rounded-[28px] p-5 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                  Total Saldo Netto Karyawan
                </span>
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <Users className="w-4 h-4 text-emerald-300" />
                </div>
              </div>
              <div className={`text-xl font-black tracking-tight ${totalOverallNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatRupiah(totalOverallNet)}
              </div>
              <p className="text-[10px] text-teal-200/80 font-sans mt-1">
                Selisih pendapatan dikurangi pengeluaran karyawan
              </p>
            </div>
          </div>
        );
      })()}

      {/* Grid of Staff Cards */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-mono">
            {searchStaff ? 'Karyawan Tidak Ditemukan' : 'Belum Ada Daftar Karyawan'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchStaff
              ? `Tidak ada karyawan yang cocok dengan kata kunci "${searchStaff}".`
              : 'Nama karyawan akan otomatis tersimpan setiap kali Anda menginput transaksi harian, atau Anda dapat menambahkannya secara manual lewat tombol di bawah.'}
          </p>
          {!searchStaff && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Karyawan Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staffName) => {
            const staffLogs = transactions.filter(
              (t) => (t.name || '').trim().toUpperCase() === staffName.trim().toUpperCase()
            );
            let pIncome = 0;
            let pExpense = 0;
            staffLogs.forEach((l) => {
              pIncome += l.income || 0;
              pExpense += l.expense || 0;
            });
            const pNet = pIncome - pExpense;

            return (
              <div
                key={staffName}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-red-300 hover:shadow-md transition-all relative group overflow-hidden`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-red-600 text-yellow-300 font-mono text-xs font-black flex items-center justify-center shadow-sm">
                      {staffName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-red-600 uppercase">
                      KARYAWAN & STAF
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-yellow-100 border border-yellow-200 text-red-950 px-2.5 py-1 rounded-full">
                    {staffLogs.length} Log
                  </span>
                </div>

                <h3 className="font-extrabold text-sm font-mono text-slate-900 mb-4 tracking-tight">
                  {staffName}
                </h3>

                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Masuk:</span>
                    <span className="text-emerald-700 font-bold">{formatRupiah(pIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Keluar:</span>
                    <span className="text-rose-600 font-bold">{formatRupiah(pExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-black">
                    <span className="text-slate-700 text-[11px]">Saldo Netto:</span>
                    <span className={pNet >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                      {formatRupiah(pNet)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedStaffDetail(staffName)}
                    className="text-red-600 hover:text-red-700 text-[11px] font-mono font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-red-600" />
                    <span>Lihat Riwayat</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingStaffName(staffName);
                        setEditStaffValue(staffName);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white/80 rounded-xl transition-colors"
                      title="Ubah Nama"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingStaffName(staffName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Hapus Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Transaction History Modal */}
      {selectedStaffDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-mono font-extrabold text-base text-slate-900 uppercase">
                  Riwayat Transaksi: {selectedStaffDetail}
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Daftar seluruh catatan pendapatan & pengeluaran karyawan
                </p>
              </div>
              <button
                onClick={() => setSelectedStaffDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {transactions.filter(
                (t) => (t.name || '').trim().toUpperCase() === selectedStaffDetail.trim().toUpperCase()
              ).length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-sans text-xs">
                  Belum ada catatan transaksi untuk {selectedStaffDetail}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 font-mono text-xs">
                  {transactions
                    .filter(
                      (t) => (t.name || '').trim().toUpperCase() === selectedStaffDetail.trim().toUpperCase()
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t) => (
                      <div key={t.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{t.date}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                              {t.category}
                            </span>
                          </div>
                          {t.note && (
                            <p className="text-[11px] text-slate-500 font-sans mt-0.5">{t.note}</p>
                          )}
                        </div>

                        <div className="text-right">
                          {t.income > 0 && (
                            <div className="text-emerald-700 font-bold">+ {formatRupiah(t.income)}</div>
                          )}
                          {t.expense > 0 && (
                            <div className="text-rose-600 font-bold">- {formatRupiah(t.expense)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setSelectedStaffDetail(null)}
                className="bg-teal-700 text-white font-mono font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-teal-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-mono font-extrabold text-sm text-slate-900 uppercase mb-4">
              Tambah Staf Baru
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono mb-2">
                  Nama Karyawan
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Contoh: KARYAWAN 01"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-mono text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-mono text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rename Staff */}
      {editingStaffName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-mono font-extrabold text-sm text-slate-900 uppercase mb-4">
              Ubah Nama Staff: {editingStaffName}
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 font-mono mb-2">
                  Nama Baru Karyawan
                </label>
                <input
                  type="text"
                  required
                  value={editStaffValue}
                  onChange={(e) => setEditStaffValue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaffName(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-mono text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-mono text-xs font-bold hover:bg-emerald-700"
                >
                  Perbarui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Staff Confirmation */}
      {deletingStaffName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 font-mono">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-sm w-full p-6 shadow-2xl border border-white/60 relative text-center">
            <button
              onClick={() => setDeletingStaffName(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 uppercase">
              Hapus Data Staf?
            </h3>

            <p className="text-xs text-slate-600 font-sans mt-2 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{deletingStaffName}</strong> dari daftar staf? Karyawan beserta seluruh riwayat transaksinya akan terhapus dari sistem dan tampilan performa.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingStaffName(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStaff(deletingStaffName);
                  setDeletingStaffName(null);
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
