import React from 'react';
import { LayoutDashboard, PlusCircle, Users, FileSpreadsheet, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Utama', icon: LayoutDashboard },
    { id: 'input', label: 'Input', icon: PlusCircle },
    { id: 'personel', label: 'Karyawan', icon: Users },
    { id: 'report', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'settings', label: 'Cloud', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 z-40 md:hidden shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
