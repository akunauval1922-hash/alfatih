import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah, isSembakoTx, isOperasionalTx } from '../lib/storage';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Calendar, Layers, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface FinancialAnalyticsChartProps {
  transactions: Transaction[];
}

export const FinancialAnalyticsChart: React.FC<FinancialAnalyticsChartProps> = ({ transactions }) => {
  const [chartType, setChartType] = useState<'trend' | 'bar' | 'pie'>('trend');
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('daily');

  // Prepare Daily Data
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number; net: number }>();
    
    // Sort transactions chronologically
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((tx) => {
      const d = tx.date || 'Tanpa Tanggal';
      if (!map.has(d)) {
        map.set(d, { date: d, income: 0, expense: 0, net: 0 });
      }
      const item = map.get(d)!;
      item.income += tx.income || 0;
      item.expense += tx.expense || 0;
      item.net = item.income - item.expense;
    });

    return Array.from(map.values()).slice(-30); // Last 30 active days
  }, [transactions]);

  // Prepare Monthly Data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; net: number }>();

    transactions.forEach((tx) => {
      const m = tx.date ? tx.date.substring(0, 7) : '2026-01';
      if (!map.has(m)) {
        map.set(m, { month: m, income: 0, expense: 0, net: 0 });
      }
      const item = map.get(m)!;
      item.income += tx.income || 0;
      item.expense += tx.expense || 0;
      item.net = item.income - item.expense;
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Category Pie Data
  const categoryPieData = useMemo(() => {
    let sembakoExpense = 0;
    let operasionalExpense = 0;
    let personelExpense = 0;
    let personelIncome = 0;

    transactions.forEach((tx) => {
      if (isSembakoTx(tx)) {
        sembakoExpense += tx.expense || 0;
      } else if (isOperasionalTx(tx)) {
        operasionalExpense += tx.expense || 0;
      } else {
        personelExpense += tx.expense || 0;
        personelIncome += tx.income || 0;
      }
    });

    return [
      { name: 'Sembako & Logistik', value: sembakoExpense, color: '#d97706' },
      { name: 'Operasional & Layanan', value: operasionalExpense, color: '#2563eb' },
      { name: 'Total Pengeluaran Karyawan', value: personelExpense, color: '#dc2626' }
    ].filter((item) => item.value > 0);
  }, [transactions]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs font-mono">
          <p className="font-bold text-yellow-400 mb-1 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold">{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4"
    >
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base font-mono uppercase tracking-tight flex items-center gap-2">
              <span>Visualisasi & Grafik Keuangan</span>
              <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                TIGA BERSAUDARA
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Analisis tren pendapatan, pengeluaran & distribusi kategori keuangan
            </p>
          </div>
        </div>

        {/* View Switches */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Chart Mode */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setChartType('trend')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'trend'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tren Area</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'pie'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Kategori</span>
            </button>
          </div>

          {/* Timeframe Switcher (if trend or bar) */}
          {chartType !== 'pie' && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeframe === 'daily'
                    ? 'bg-slate-900 text-yellow-400'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-slate-900 text-yellow-400'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Display */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {chartType === 'trend' && (
          <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
            <AreaChart
              data={timeframe === 'daily' ? dailyData : monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey={timeframe === 'daily' ? 'date' : 'month'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                dataKey="income"
                name="Pendapatan (Kas Masuk)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Pengeluaran (Kas Keluar)"
                stroke="#ef4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
            <BarChart
              data={timeframe === 'daily' ? dailyData : monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey={timeframe === 'daily' ? 'date' : 'month'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Bar dataKey="income" name="Pendapatan" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'pie' && (
          <div className="h-full w-full flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Pie Legend */}
            <div className="w-full md:w-1/2 space-y-2.5 font-mono text-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Distribusi Total Pengeluaran
              </p>
              {categoryPieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
