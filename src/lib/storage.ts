import { Transaction, Personnel, AppConfig } from '../types';
import * as XLSX from 'xlsx';

export const DEFAULT_STAFF: string[] = [];

const DB_KEY = 'alfatih_2030_db_v2';
const BACKUP_KEY = 'alfatih_2030_auto_backup';
const CONFIG_KEY = 'alfatih_2030_config';
const STAFF_KEY = 'alfatih_2030_staff';
const AUTH_PASS_KEY = 'alfatih_2030_auth_pass';

// --- SECURITY & SANITIZATION HELPERS ---
export const sanitizeText = (input: string, maxLen = 250): string => {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[<>"']/g, '')   // Strip sensitive characters
    .trim()
    .substring(0, maxLen);
};

export const sanitizeNumber = (val: any): number => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num) || num < 0) return 0;
  return Math.min(Math.floor(num), 1_000_000_000_000); // 1 Trillion max limit for safety
};

export const loadAuthPassword = (): string => {
  try {
    const pass = localStorage.getItem(AUTH_PASS_KEY);
    return pass && pass.trim().length >= 4 ? pass.trim() : 'admin123';
  } catch (e) {
    return 'admin123';
  }
};

export const saveAuthPassword = (newPass: string): boolean => {
  try {
    if (!newPass || newPass.trim().length < 4) return false;
    localStorage.setItem(AUTH_PASS_KEY, newPass.trim());
    return true;
  } catch (e) {
    return false;
  }
};

const sanitizeTransaction = (raw: any): Transaction | null => {
  if (!raw || typeof raw !== 'object') return null;
  const id = Number(raw.id) || Date.now();
  const dateStr = raw.date && typeof raw.date === 'string' && raw.date.match(/^\d{4}-\d{2}-\d{2}/)
    ? raw.date.substring(0, 10)
    : new Date().toISOString().split('T')[0];

  return {
    id,
    date: dateStr,
    category: sanitizeText(raw.category || 'personel', 50),
    name: sanitizeText(raw.name || 'UMUM', 100),
    income: sanitizeNumber(raw.income),
    expense: sanitizeNumber(raw.expense),
    note: sanitizeText(raw.note || '', 250),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    syncedToCloud: Boolean(raw.syncedToCloud)
  };
};

export const loadTransactions = (): Transaction[] => {
  try {
    let raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      // Try fallback auto-backup if primary DB was somehow cleared
      raw = localStorage.getItem(BACKUP_KEY);
    }

    if (!raw) {
      // Clean initial database
      const initial: Transaction[] = [];
      saveTransactions(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const sanitized = parsed
      .map(sanitizeTransaction)
      .filter((t): t is Transaction => t !== null);

    return sanitized;
  } catch (e) {
    console.error("Error loading transactions from localStorage", e);
    return [];
  }
};

export const saveTransactions = (data: Transaction[]) => {
  try {
    const cleanData = data
      .map(sanitizeTransaction)
      .filter((t): t is Transaction => t !== null);

    const json = JSON.stringify(cleanData);
    localStorage.setItem(DB_KEY, json);
    // Double-vault auto backup
    localStorage.setItem(BACKUP_KEY, json);
  } catch (e) {
    console.error("Error saving transactions", e);
  }
};

// JSON Backup & Restore for 100% Data Protection
export const exportDataBackup = (transactions: Transaction[], staffList: string[], config: AppConfig) => {
  const data = {
    app: "KEUANGAN_TIGA_BERSAUDARA_2030",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    transactions,
    staffList,
    config
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CADANGAN_DATA_KEUANGAN_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importDataBackup = (jsonString: string): { success: boolean; count: number; msg: string; transactions?: Transaction[]; staff?: string[] } => {
  try {
    const parsed = JSON.parse(jsonString);
    let items: any[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.transactions)) {
      items = parsed.transactions;
    } else {
      return { success: false, count: 0, msg: "Format file JSON cadangan tidak valid." };
    }

    const sanitized = items
      .map(sanitizeTransaction)
      .filter((t): t is Transaction => t !== null);

    if (sanitized.length === 0) {
      return { success: false, count: 0, msg: "Tidak ada transaksi valid yang ditemukan di file cadangan." };
    }

    saveTransactions(sanitized);

    let restoredStaff: string[] | undefined;
    if (parsed && Array.isArray(parsed.staffList) && parsed.staffList.length > 0) {
      restoredStaff = parsed.staffList.map((s: string) => sanitizeText(s, 50)).filter(Boolean);
      localStorage.setItem(STAFF_KEY, JSON.stringify(restoredStaff));
    }

    return {
      success: true,
      count: sanitized.length,
      msg: `Berhasil memulihkan ${sanitized.length} data transaksi secara aman!`,
      transactions: sanitized,
      staff: restoredStaff
    };
  } catch (e) {
    return { success: false, count: 0, msg: "Gagal membaca file JSON cadangan. Pastikan file tidak terdistorsi." };
  }
};

export const loadConfig = (): AppConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { googleScriptUrl: '', autoSync: true };
    const parsed = JSON.parse(raw);
    return {
      googleScriptUrl: parsed.googleScriptUrl || '',
      autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true
    };
  } catch (e) {
    return { googleScriptUrl: '', autoSync: true };
  }
};

export const saveConfig = (config: AppConfig) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save config to localStorage", e);
  }
};

export const loadStaff = (): string[] => {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    if (!raw) return DEFAULT_STAFF;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_STAFF;
  }
};

export const saveStaff = (staff: string[]) => {
  try {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  } catch (e) {
    console.warn("Failed to save staff to localStorage", e);
  }
};

export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export const isSembakoTx = (t: Transaction): boolean => {
  const cat = (t.category || '').toLowerCase();
  const name = (t.name || '').toLowerCase();
  const note = (t.note || '').toLowerCase();
  return cat === 'logistik' || cat === 'sembako' || name.includes('sembako') || name.includes('logistik') || note.includes('sembako') || note.includes('logistik');
};

export const isOperasionalTx = (t: Transaction): boolean => {
  const cat = (t.category || '').toLowerCase();
  const name = (t.name || '').toLowerCase();
  const note = (t.note || '').toLowerCase();
  return cat === 'layanan' || cat === 'operasional' || name.includes('operasional') || name.includes('layanan') || note.includes('operasional') || note.includes('layanan');
};

export const sendToGoogleSheets = async (scriptUrl: string, entry: Transaction): Promise<boolean> => {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    return false;
  }

  const payload = {
    id: entry.id,
    date: entry.date,
    category: entry.category,
    name: entry.name,
    income: entry.income || 0,
    expense: entry.expense || 0,
    net: (entry.income || 0) - (entry.expense || 0),
    totalIncome: entry.income || 0,
    totalExpense: entry.expense || 0,
    totalHasil: (entry.income || 0) - (entry.expense || 0),
    note: entry.note || ''
  };

  try {
    await fetch(scriptUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Failed sending to Google Sheets:", error);
    return false;
  }
};

export const sendBatchToGoogleSheets = async (scriptUrl: string, entries: Transaction[]): Promise<boolean> => {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http') || entries.length === 0) {
    return false;
  }

  const payload = entries.map(entry => ({
    id: entry.id,
    date: entry.date,
    category: entry.category,
    name: entry.name,
    income: entry.income || 0,
    expense: entry.expense || 0,
    net: (entry.income || 0) - (entry.expense || 0),
    totalIncome: entry.income || 0,
    totalExpense: entry.expense || 0,
    totalHasil: (entry.income || 0) - (entry.expense || 0),
    note: entry.note || ''
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    await fetch(scriptUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error("Failed sending batch to Google Sheets:", error);
    return true;
  }
};

export const fetchFromGoogleSheets = async (scriptUrl: string, timeoutMs: number = 8000): Promise<Transaction[] | null> => {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    return null;
  }

  try {
    let url = scriptUrl.trim();
    if (!url.includes('format=json')) {
      url += (url.includes('?') ? '&' : '?') + 'format=json';
    }
    url += `&_t=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      const parsed: Transaction[] = data.map((item: any, idx: number) => {
        let cleanDate = new Date().toISOString().split('T')[0];
        if (item.date) {
          const s = String(item.date).trim();
          if (s.length >= 10) cleanDate = s.substring(0, 10);
        }

        return {
          id: item.id ? Number(item.id) : Date.now() - idx * 1000,
          date: cleanDate,
          category: (item.category || 'personel').toString().toLowerCase(),
          name: (item.name || 'KARYAWAN').toString().trim().toUpperCase(),
          income: Number(item.income) || 0,
          expense: Number(item.expense) || 0,
          note: item.note ? String(item.note) : '',
          syncedToCloud: true,
          createdAt: item.createdAt || item.date || new Date().toISOString()
        };
      });
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn("Fetch from Google Sheets failed:", error);
    return null;
  }
};

export const exportToExcel = (
  transactions: Transaction[],
  staffList: string[],
  categoryLabel: string = 'Keseluruhan',
  periodLabel: string = 'Semua Periode'
) => {
  const wb = XLSX.utils.book_new();

  // Grand totals overall
  const grandIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
  const grandExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
  const grandNet = grandIncome - grandExpense;

  // Sheet 1: Raw Transactions
  const rawData: any[] = transactions.map((t, idx) => ({
    "No": idx + 1,
    "ID Transaksi": t.id,
    "Tanggal": t.date,
    "Kategori": t.category.toUpperCase(),
    "Nama / Subjek Karyawan": t.name,
    "Total Pendapatan (IDR)": t.income || 0,
    "Total Pengeluaran (IDR)": t.expense || 0,
    "Total Hasil / Saldo (IDR)": (t.income || 0) - (t.expense || 0),
    "Catatan / Keterangan": t.note || "-",
    "Status Cloud": t.syncedToCloud ? "TERKIRIM" : "LOKAL"
  }));

  // Append Grand Total Summary Row
  rawData.push({
    "No": "-",
    "ID Transaksi": "SUMMARY",
    "Tanggal": "-",
    "Kategori": `TOTAL (${categoryLabel.toUpperCase()} - ${periodLabel.toUpperCase()})`,
    "Nama / Subjek Karyawan": "REKAPITULASI DANA",
    "Total Pendapatan (IDR)": grandIncome,
    "Total Pengeluaran (IDR)": grandExpense,
    "Total Hasil / Saldo (IDR)": grandNet,
    "Catatan / Keterangan": `Audit ${categoryLabel} (${periodLabel})`,
    "Status Cloud": "AUDITED"
  });

  const wsTransactions = XLSX.utils.json_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Riwayat Transaksi");

  // Sheet 2: Staff Summary
  const staffSummary: any[] = staffList.map((staffName, idx) => {
    const logs = transactions.filter(t => t.name === staffName);
    let inTotal = 0, outTotal = 0;
    logs.forEach(l => {
      inTotal += l.income || 0;
      outTotal += l.expense || 0;
    });
    return {
      "No": idx + 1,
      "Nama Karyawan": staffName,
      "Total Log Transaksi": logs.length,
      "Total Pendapatan (IDR)": inTotal,
      "Total Pengeluaran (IDR)": outTotal,
      "Total Hasil / Saldo (IDR)": inTotal - outTotal,
      "Status Performa": (inTotal - outTotal) >= 0 ? "SURPLUS / UNTUNG" : "DEFISIT / RUGI"
    };
  });

  staffSummary.push({
    "No": "-",
    "Nama Karyawan": "TOTAL KESELURUHAN STAFF",
    "Total Log Transaksi": transactions.length,
    "Total Pendapatan (IDR)": grandIncome,
    "Total Pengeluaran (IDR)": grandExpense,
    "Total Hasil / Saldo (IDR)": grandNet,
    "Status Performa": grandNet >= 0 ? "TOTAL SURPLUS" : "TOTAL DEFISIT"
  });

  const wsStaff = XLSX.utils.json_to_sheet(staffSummary);
  XLSX.utils.book_append_sheet(wb, wsStaff, "Rekap Karyawan");

  // Save file
  const safeCategory = categoryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Tiga_Bersaudara_${safeCategory}_${safePeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const generateGoogleAppsScriptCode = (): string => {
  return `// === GOOGLE APPS SCRIPT UNTUK KEUANGAN TIGA BERSAUDARA ===
// 1. Tempelkan kode ini di Google Sheets -> Extensions -> Apps Script
// 2. Klik Deploy -> New Deployment -> Web App
// 3. Set "Execute as: Me" dan "Who has access: Anyone"
// 4. Salin Web App URL dan masukkan ke menu Pengaturan Aplikasi

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (e && e.parameter && e.parameter.format === "json") {
      var data = [];
      if (lastRow >= 2) {
        var rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var idVal = String(row[0] || "");
          var catVal = String(row[2] || "");

          if (idVal !== "SUMMARY" && catVal.indexOf("TOTAL KESELURUHAN") === -1) {
            data.push({
              id: Number(row[0]) || (Date.now() - i),
              date: row[1] ? String(row[1]).split("T")[0] : new Date().toISOString().split("T")[0],
              category: String(row[2] || "personel").toLowerCase(),
              name: String(row[3] || "KARYAWAN"),
              income: Number(row[4]) || 0,
              expense: Number(row[5]) || 0,
              note: String(row[7] || ""),
              syncedToCloud: true
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif; padding:20px; text-align:center; color:#991b1b;">' +
      '<h2>✅ Web App Sistem Kontrol Laporan Keuangan Berfungsi Aktif!</h2>' +
      '<p>Gunakan URL ini di aplikasi untuk Sinkronisasi Otomatis Data Keuangan.</p>' +
      '</div>'
    );
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. Otomatis buat Judul Kolom di Baris 1 jika lembar kerja masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID Transaksi",
        "Tanggal",
        "Kategori",
        "Nama / Subjek Karyawan",
        "Total Pendapatan (IDR)",
        "Total Pengeluaran (IDR)",
        "Total Hasil / Saldo (IDR)",
        "Catatan / Keterangan",
        "Waktu Sync"
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e2e8f0");
    }

    // 2. Jika baris terakhir di tabel adalah baris "TOTAL KESELURUHAN" sebelumnya, hapus dahulu
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var lastCatVal = String(sheet.getRange(lastRow, 3).getValue() || "");
      var lastIdVal = String(sheet.getRange(lastRow, 1).getValue() || "");
      if (lastCatVal.indexOf("TOTAL KESELURUHAN") !== -1 || lastIdVal === "SUMMARY") {
        sheet.deleteRow(lastRow);
      }
    }

    // 3. Tambahkan baris transaksi baru
    var items = Array.isArray(data) ? data : [data];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.category === "TOTAL KESELURUHAN" || item.id === "SUMMARY") {
        continue;
      }

      var income = Number(item.income || item.totalIncome || 0);
      var expense = Number(item.expense || item.totalExpense || 0);
      var net = Number(item.net || item.totalHasil || (income - expense));

      sheet.appendRow([
        item.id || Date.now(),
        item.date || new Date().toISOString().split('T')[0],
        (item.category || "Input App").toUpperCase(),
        item.name || "-",
        income,
        expense,
        net,
        item.note || "-",
        new Date().toLocaleString("id-ID")
      ]);
    }

    // 4. Hitung Ulang Grand Total dari seluruh baris data
    var newLastRow = sheet.getLastRow();
    if (newLastRow >= 2) {
      var grandIncome = 0;
      var grandExpense = 0;
      var dataRange = sheet.getRange(2, 1, newLastRow - 1, 9).getValues();

      for (var r = 0; r < dataRange.length; r++) {
        var rowCat = String(dataRange[r][2] || "");
        var rowId = String(dataRange[r][0] || "");
        
        if (rowCat.indexOf("TOTAL KESELURUHAN") === -1 && rowId !== "SUMMARY") {
          grandIncome += Number(dataRange[r][4] || 0);
          grandExpense += Number(dataRange[r][5] || 0);
        }
      }

      var grandNet = grandIncome - grandExpense;

      // 5. Lampirkan Baris TOTAL KESELURUHAN di baris paling bawah
      sheet.appendRow([
        "SUMMARY",
        new Date().toISOString().split('T')[0],
        "TOTAL KESELURUHAN",
        "3 BERSAUDARA HQ",
        grandIncome,
        grandExpense,
        grandNet,
        "REKAPITULASI DANA AKHIR",
        new Date().toLocaleString("id-ID")
      ]);

      var summaryRowIdx = sheet.getLastRow();
      sheet.getRange(summaryRowIdx, 1, 1, 9)
        .setFontWeight("bold")
        .setBackground("#fef08a")
        .setFontColor("#713f12");
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success", 
      "count": items.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error", 
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
};

