import React from 'react';
import {
  Landmark,
  LayoutDashboard,
  Users,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Power,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: string;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'SYSTEM UTAMA', icon: LayoutDashboard },
    { id: 'input', label: 'INPUT TRANSAKSI', icon: PlusCircle },
    { id: 'personel', label: 'PERFORMA KARYAWAN', icon: Users },
    { id: 'report', label: 'PUSAT LAPORAN KEUANGAN', icon: FileSpreadsheet },
    { id: 'settings', label: 'SISTEM KONTROL', icon: Settings }
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-red-700 text-slate-100 flex flex-col border-r border-red-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 bg-red-800 border-b border-red-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-400 p-2.5 rounded-xl text-red-900 shadow-md shadow-yellow-500/20 font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-xs tracking-wider font-mono text-white uppercase flex flex-col gap-0.5">
                <span>TIGA BERSAUDARA</span>
                <span className="bg-yellow-400 text-red-950 px-2 py-0.5 rounded text-[9px] font-black w-fit tracking-wider">SISTEM KEUANGAN</span>
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                </span>
                <span className="text-[9px] text-yellow-300 font-mono font-bold tracking-tight uppercase">
                  3 BERSAUDARA HQ
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden text-red-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto bg-red-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 font-sans cursor-pointer ${
                  isActive
                    ? 'bg-white text-red-700 shadow-md font-extrabold'
                    : 'text-red-100 hover:bg-red-600/80 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-red-200'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-red-800 bg-red-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-red-950 shadow-md flex items-center justify-center text-xs font-extrabold font-mono shrink-0">
              {currentUser.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold font-mono text-white truncate">{currentUser}</p>
              <p className="text-[9px] font-mono text-yellow-300 font-bold uppercase">MEMBER ADMIN</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-yellow-300 hover:bg-red-800 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Keluar"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
