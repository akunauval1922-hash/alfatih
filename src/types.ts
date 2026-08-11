export interface Transaction {
  id: number;
  date: string; // YYYY-MM-DD
  category: string; // 'personel' | 'logistik' | 'layanan' | string
  name: string; // Employee name or category title
  income: number;
  expense: number;
  note: string;
  syncedToCloud?: boolean;
  createdAt?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role?: string;
  active: boolean;
}

export interface AppConfig {
  googleScriptUrl: string;
  autoSync: boolean;
}

export interface FilterState {
  searchQuery: string;
  selectedMonth: string; // 'ALL' or 'YYYY-MM'
  categoryFilter: string; // 'ALL' or specific category
}

