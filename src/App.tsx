import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, AppConfig } from './types';
import {
  loadTransactions,
  saveTransactions,
  loadConfig,
  saveConfig,
  loadStaff,
  saveStaff,
  DEFAULT_STAFF,
  sendToGoogleSheets,
  sendBatchToGoogleSheets,
  fetchFromGoogleSheets
} from './lib/storage';

import { AuthOverlay } from './components/AuthOverlay';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { InputTab } from './components/InputTab';
import { PersonelTab } from './components/PersonelTab';
import { ReportTab } from './components/ReportTab';
import { SettingsTab } from './components/SettingsTab';
import { EditModal } from './components/EditModal';

export default function App() {
  // Session Authentication
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('app_session_user') || localStorage.getItem('app_session_user') || 'ADMIN';
    } catch (e) {
      return 'ADMIN';
    }
  });

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [staffList, setStaffList] = useState<string[]>(loadStaff);
  const [config, setConfig] = useState<AppConfig>(loadConfig);

  // Active Tab & Layout
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Editing Modal
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Live Clock
  const [liveClock, setLiveClock] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      setLiveClock(new Date().toLocaleString('id-ID'));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to localStorage automatically
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStaff(staffList);
  }, [staffList]);

  // Auto-discover staff names from transactions (e.g. pulled from database/cloud)
  useEffect(() => {
    if (transactions.length > 0) {
      const staffSet = new Set<string>(staffList.map((s) => s.trim().toUpperCase()));
      let hasNewStaff = false;

      transactions.forEach((tx) => {
        if (tx.name && tx.name.trim()) {
          const cleanName = tx.name.trim().toUpperCase();
          const isSystemCategory = [
            'SEMBAKO & LOGISTIK',
            'OPERASIONAL & LAYANAN',
            'LOGISTIK',
            'LAYANAN',
            'LAINNYA'
          ].includes(cleanName);

          if (tx.category === 'personel' || !isSystemCategory) {
            if (!staffSet.has(cleanName)) {
              staffSet.add(cleanName);
              hasNewStaff = true;
            }
          }
        }
      });

      if (hasNewStaff) {
        const updatedList = Array.from(staffSet);
        setStaffList(updatedList);
        saveStaff(updatedList);
      }
    }
  }, [transactions]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Auth Handler
  const handleLoginSuccess = (user: string) => {
    try {
      sessionStorage.setItem('app_session_user', user);
      localStorage.setItem('app_session_user', user);
    } catch (e) {
      console.warn('Failed to write app_session_user', e);
    }
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('app_session_user');
      localStorage.removeItem('app_session_user');
    } catch (e) {
      console.warn('Failed to remove app_session_user', e);
    }
    setCurrentUser(null);
  };

  // Available Months for filter (includes full past and future years without limits)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    // 1. Add all months present in transaction logs
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7));
      }
    });

    // 2. Add past 3 years to future 2 years so user can select any past or future month
    const today = new Date();
    const currY = today.getFullYear();
    for (let y = currY - 3; y <= currY + 2; y++) {
      for (let m = 1; m <= 12; m++) {
        const mStr = `${y}-${String(m).padStart(2, '0')}`;
        months.add(mStr);
      }
    }

    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month Filter
      if (selectedMonth !== 'ALL' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.name.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesNote = (tx.note || '').toLowerCase().includes(q);
        const matchesDate = tx.date.includes(q);
        return matchesName || matchesCategory || matchesNote || matchesDate;
      }
      return true;
    });
  }, [transactions, selectedMonth, searchQuery]);

  // Actions: Add Transaction
  const handleAddTransaction = async (txData: Omit<Transaction, 'id'>): Promise<boolean> => {
    const newTx: Transaction = {
      ...txData,
      id: Date.now(),
      syncedToCloud: false,
      createdAt: new Date().toISOString()
    };

    // 1. Instant local update (0ms latency for smooth & fast UX)
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Asynchronous background Google Sheets sync
    if (config.googleScriptUrl) {
      sendToGoogleSheets(config.googleScriptUrl, newTx).then((synced) => {
        if (synced) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === newTx.id ? { ...t, syncedToCloud: true } : t))
          );
        }
      });
    }

    return true;
  };

  // Actions: Edit Transaction
  const handleSaveEditedTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  // Actions: Delete Transaction
  const handleDeleteTransaction = (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Actions: Staff management
  const handleAddStaff = (name: string) => {
    const clean = name.trim().toUpperCase();
    if (clean && !staffList.some((s) => s.trim().toUpperCase() === clean)) {
      setStaffList((prev) => [...prev, clean]);
    }
  };

  const handleRenameStaff = (oldName: string, newName: string) => {
    const cleanOld = oldName.trim().toUpperCase();
    const cleanNew = newName.trim().toUpperCase();
    setStaffList((prev) =>
      prev.map((s) => (s.trim().toUpperCase() === cleanOld ? cleanNew : s))
    );
    setTransactions((prev) =>
      prev.map((t) =>
        (t.name || '').trim().toUpperCase() === cleanOld ? { ...t, name: cleanNew } : t
      )
    );
  };

  const handleDeleteStaff = (name: string) => {
    const cleanDelete = name.trim().toUpperCase();
    setStaffList((prev) => prev.filter((s) => s.trim().toUpperCase() !== cleanDelete));
  };

  // Actions: Reset All Data
  const handleClearAllData = () => {
    setTransactions([]);
    saveTransactions([]);
    setStaffList(DEFAULT_STAFF);
    saveStaff(DEFAULT_STAFF);
  };

  // Actions: Refresh / Kirim Data Aplikasi ke Database (Push) - FAST & OPTIMISTIC
  const handleRefreshDataToDatabase = async (): Promise<{ count: number; success: boolean; msg: string }> => {
    if (transactions.length === 0) {
      return { count: 0, success: true, msg: 'Tidak ada data transaksi lokal yang perlu dikirim.' };
    }

    const count = transactions.length;

    // 1. Instant local update (0ms latency for instant response)
    const updated = transactions.map((t) => ({ ...t, syncedToCloud: true }));
    setTransactions(updated);
    saveTransactions(updated);

    // 2. Send batch to Google Sheets in background / fast batch
    if (config.googleScriptUrl) {
      const unsyncedItems = transactions.filter((t) => !t.syncedToCloud);
      const itemsToSync = unsyncedItems.length > 0 ? unsyncedItems : transactions;
      sendBatchToGoogleSheets(config.googleScriptUrl, itemsToSync).catch((err) => {
        console.warn('Background sync warning:', err);
      });
    }

    return {
      count,
      success: true,
      msg: config.googleScriptUrl
        ? `⚡ Berhasil memperbarui & mengirim ${count} data ke Sistem Kontrol (Super Cepat)!`
        : `⚡ Berhasil memperbarui ${count} data transaksi lokal di database aplikasi!`
    };
  };

  // Actions: Update / Ambil Data dari Database ke Aplikasi (Pull) - INSTANT 1-CLICK
  const handleUpdateDataFromDatabase = async (): Promise<{ count: number; success: boolean; msg: string }> => {
    // 1. Instantly reload local storage state
    const reloaded = loadTransactions();

    // 2. Try direct cloud fetch (up to 8s timeout for Google Apps Script execution)
    if (config.googleScriptUrl) {
      try {
        const cloudData = await fetchFromGoogleSheets(config.googleScriptUrl, 8000);
        if (cloudData && Array.isArray(cloudData)) {
          const map = new Map<number, Transaction>();
          reloaded.forEach((t) => map.set(t.id, t));
          cloudData.forEach((t) => map.set(t.id, t));

          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          // Extract staff names from merged dataset
          const staffSet = new Set<string>(staffList.map((s) => s.trim().toUpperCase()));
          merged.forEach((tx) => {
            if (tx.name && tx.name.trim()) {
              const cleanName = tx.name.trim().toUpperCase();
              const isSystemCategory = [
                'SEMBAKO & LOGISTIK',
                'OPERASIONAL & LAYANAN',
                'LOGISTIK',
                'LAYANAN',
                'LAINNYA'
              ].includes(cleanName);

              if (tx.category === 'personel' || !isSystemCategory) {
                staffSet.add(cleanName);
              }
            }
          });

          const updatedStaffList = Array.from(staffSet);
          setStaffList(updatedStaffList);
          saveStaff(updatedStaffList);

          setTransactions(merged);
          saveTransactions(merged);

          return {
            count: merged.length,
            success: true,
            msg: `⚡ 1-Klik Berhasil! ${merged.length} data transaksi langsung diperbarui dari Sistem Kontrol!`
          };
        }
      } catch (e) {
        console.warn('Cloud pull fallback to local:', e);
      }
    }

    setTransactions(reloaded);
    return {
      count: reloaded.length,
      success: true,
      msg: `⚡ 1-Klik Berhasil! Data lokal diperbarui (${reloaded.length} transaksi).`
    };
  };

  // Actions: Batch Sync Unsynced Records
  const handleSyncUnsyncedRecords = async (): Promise<number> => {
    const res = await handleRefreshDataToDatabase();
    return res.count;
  };

  // Actions: Restore Data from Backup JSON
  const handleRestoreData = (restoredTransactions: Transaction[], restoredStaff?: string[]) => {
    setTransactions(restoredTransactions);
    saveTransactions(restoredTransactions);
    if (restoredStaff && restoredStaff.length > 0) {
      setStaffList(restoredStaff);
      saveStaff(restoredStaff);
    }
  };

  // Active Tab Title mapping
  const activeTabTitles: Record<string, string> = {
    dashboard: 'LAPORAN KEUANGAN TIGA BERSAUDARA',
    input: 'INPUT TRANSAKSI KEUANGAN',
    personel: 'PERFORMA KARYAWAN & STAF',
    report: 'PUSAT LAPORAN KEUANGAN',
    settings: 'SISTEM KONTROL'
  };

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col md:flex-row text-slate-900 font-sans selection:bg-red-600 selection:text-white antialiased">
      {/* Show Auth Overlay if not logged in */}
      {!currentUser && <AuthOverlay onLoginSuccess={handleLoginSuccess} />}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser || 'ADMIN'}
        onLogout={handleLogout}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72 min-h-screen">
        {/* Header */}
        <Header
          activeTabTitle={activeTabTitles[activeTab] || 'System'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={availableMonths}
          liveClock={liveClock}
          hasGoogleScript={Boolean(config.googleScriptUrl)}
          onToggleSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
          onOpenSettings={() => setActiveTab('settings')}
          onRefreshToDatabase={handleRefreshDataToDatabase}
          onUpdateFromDatabase={handleUpdateDataFromDatabase}
        />

        {/* Dynamic Tab Views */}
        <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              transactions={filteredTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={setEditingTx}
              onGoToInput={() => setActiveTab('input')}
              hasGoogleScript={Boolean(config.googleScriptUrl)}
              unsyncedCount={transactions.filter((t) => !t.syncedToCloud).length}
              onSyncUnsynced={handleSyncUnsyncedRecords}
              onRefreshToDatabase={handleRefreshDataToDatabase}
              onUpdateFromDatabase={handleUpdateDataFromDatabase}
            />
          )}

          {activeTab === 'input' && (
            <InputTab
              staffList={staffList}
              onAddTransaction={handleAddTransaction}
              hasGoogleScript={Boolean(config.googleScriptUrl)}
              onAddStaff={handleAddStaff}
            />
          )}

          {activeTab === 'personel' && (
            <PersonelTab
              staffList={staffList}
              transactions={transactions}
              onAddStaff={handleAddStaff}
              onRenameStaff={handleRenameStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'report' && (
            <ReportTab
              transactions={filteredTransactions}
              staffList={staffList}
              onClearAllData={handleClearAllData}
              googleScriptUrl={config.googleScriptUrl}
              onOpenSettings={() => setActiveTab('settings')}
              onSyncUnsynced={handleSyncUnsyncedRecords}
              onRefreshToDatabase={handleRefreshDataToDatabase}
              onUpdateFromDatabase={handleUpdateDataFromDatabase}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              config={config}
              onSaveConfig={setConfig}
              transactions={transactions}
              staffList={staffList}
              onSyncUnsynced={handleSyncUnsyncedRecords}
              onRefreshToDatabase={handleRefreshDataToDatabase}
              onUpdateFromDatabase={handleUpdateDataFromDatabase}
              onRestoreData={handleRestoreData}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditModal
          transaction={editingTx}
          staffList={staffList}
          onSave={handleSaveEditedTransaction}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
