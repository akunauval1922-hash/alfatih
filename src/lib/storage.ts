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

export const clearAllDatabaseStorage = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
    localStorage.setItem(BACKUP_KEY, JSON.stringify([]));
    localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF));
  } catch (e) {
    console.error("Error clearing database storage", e);
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

export const sendToGoogleSheets = async (scriptUrl: string, entry: Transaction | { action: string; id: number }): Promise<boolean> => {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    return false;
  }

  let payload: any;
  if ('action' in entry && entry.action === 'delete') {
    payload = { action: 'delete', id: entry.id };
  } else {
    const tx = entry as Transaction;
    payload = {
      id: tx.id,
      date: tx.date,
      category: tx.category,
      name: tx.name,
      income: tx.income || 0,
      expense: tx.expense || 0,
      net: (tx.income || 0) - (tx.expense || 0),
      totalIncome: tx.income || 0,
      totalExpense: tx.expense || 0,
      totalHasil: (tx.income || 0) - (tx.expense || 0),
      note: tx.note || ''
    };
  }

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

export const fetchFromGoogleSheets = async (scriptUrl: string, timeoutMs: number = 10000): Promise<Transaction[] | null> => {
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

    // Simple fetch without custom request headers to prevent CORS preflight OPTIONS failures on script.google.com
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
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

        const parseAmount = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const clean = String(val).replace(/[^0-9.-]/g, '');
          return Number(clean) || 0;
        };

        return {
          id: item.id ? Number(item.id) : Date.now() - idx * 1000,
          date: cleanDate,
          category: (item.category || 'personel').toString().toLowerCase(),
          name: (item.name || 'KARYAWAN').toString().trim().toUpperCase(),
          income: parseAmount(item.income),
          expense: parseAmount(item.expense),
          note: item.note ? String(item.note) : '',
          syncedToCloud: true,
          createdAt: item.createdAt || item.date || new Date().toISOString()
        };
      });
      return parsed;
    } else if (data && typeof data === 'object' && (data as any).error) {
      throw new Error(String((data as any).error));
    }
    return null;
  } catch (error) {
    console.warn("Fetch from Google Sheets failed:", error);
    throw error;
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

  // Sheet 1: Raw Transactions (Format Database Spreadsheet)
  const rawData: any[] = transactions.map((t, idx) => ({
    "No": idx + 1,
    "ID Transaksi": t.id,
    "Tanggal": t.date,
    "Kategori": t.category.toUpperCase(),
    "Nama / Subjek Karyawan": t.name,
    "Total Pendapatan (IDR)": formatRupiah(t.income || 0),
    "Total Pengeluaran (IDR)": formatRupiah(t.expense || 0),
    "Total Hasil / Saldo (IDR)": formatRupiah((t.income || 0) - (t.expense || 0)),
    "Catatan / Keterangan": t.note || "-",
    "Status Cloud": t.syncedToCloud ? "TERKIRIM" : "LOKAL"
  }));

  // Append Total Summary Row
  rawData.push({
    "No": "-",
    "ID Transaksi": "-",
    "Tanggal": "-",
    "Kategori": "TOTAL",
    "Nama / Subjek Karyawan": "Total Hasil Pendapatan dan Pengeluaran Karyawan",
    "Total Pendapatan (IDR)": formatRupiah(grandIncome),
    "Total Pengeluaran (IDR)": formatRupiah(grandExpense),
    "Total Hasil / Saldo (IDR)": formatRupiah(grandNet),
    "Catatan / Keterangan": `Audit ${categoryLabel} (${periodLabel})`,
    "Status Cloud": "AUDITED"
  });

  const wsTransactions = XLSX.utils.json_to_sheet(rawData);

  // Calculate clean column widths for Worksheet 1
  if (rawData.length > 0) {
    const keysTx = Object.keys(rawData[0]);
    const colWidthsTx = keysTx.map(key => {
      let maxLen = key.length;
      rawData.forEach(row => {
        const val = row[key];
        if (val !== null && val !== undefined) {
          const strVal = val.toString();
          if (strVal.length > maxLen) maxLen = strVal.length;
        }
      });
      return { wch: Math.max(maxLen + 5, 16) };
    });
    wsTransactions['!cols'] = colWidthsTx;
  }

  XLSX.utils.book_append_sheet(wb, wsTransactions, "Riwayat Transaksi");

  // Sheet 2: Staff Summary (Format Database Spreadsheet)
  const staffSummary: any[] = staffList.map((staffName, idx) => {
    const logs = transactions.filter(t => t.name === staffName);
    let inTotal = 0, outTotal = 0;
    logs.forEach(l => {
      inTotal += l.income || 0;
      outTotal += l.expense || 0;
    });
    const netTotal = inTotal - outTotal;
    return {
      "No": idx + 1,
      "Nama Karyawan": staffName,
      "Total Log Transaksi": logs.length,
      "Total Pendapatan (IDR)": formatRupiah(inTotal),
      "Total Pengeluaran (IDR)": formatRupiah(outTotal),
      "Total Hasil / Saldo (IDR)": formatRupiah(netTotal),
      "Status Performa": netTotal >= 0 ? "SURPLUS / UNTUNG" : "DEFISIT / RUGI"
    };
  });

  staffSummary.push({
    "No": "-",
    "Nama Karyawan": "Total Hasil Pendapatan dan Pengeluaran Karyawan",
    "Total Log Transaksi": transactions.length,
    "Total Pendapatan (IDR)": formatRupiah(grandIncome),
    "Total Pengeluaran (IDR)": formatRupiah(grandExpense),
    "Total Hasil / Saldo (IDR)": formatRupiah(grandNet),
    "Status Performa": grandNet >= 0 ? "TOTAL SURPLUS" : "TOTAL DEFISIT"
  });

  const wsStaff = XLSX.utils.json_to_sheet(staffSummary);

  // Calculate clean column widths for Worksheet 2
  if (staffSummary.length > 0) {
    const keysStaff = Object.keys(staffSummary[0]);
    const colWidthsStaff = keysStaff.map(key => {
      let maxLen = key.length;
      staffSummary.forEach(row => {
        const val = row[key];
        if (val !== null && val !== undefined) {
          const strVal = val.toString();
          if (strVal.length > maxLen) maxLen = strVal.length;
        }
      });
      return { wch: Math.max(maxLen + 5, 16) };
    });
    wsStaff['!cols'] = colWidthsStaff;
  }

  XLSX.utils.book_append_sheet(wb, wsStaff, "Rekap Karyawan");

  // Save file
  const safeCategory = categoryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_System_Aplikasi_${safeCategory}_${safePeriod}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const generateGoogleAppsScriptCode = (): string => {
  return `// === GOOGLE APPS SCRIPT UNTUK LAPORAN KEUANGAN SYSTEM APLIKASI ===
// 1. Tempelkan kode ini di Google Sheets -> Extensions -> Apps Script
// 2. Klik Deploy -> New Deployment -> Web App
// 3. Set "Execute as: Me" dan "Who has access: Anyone"
// 4. Salin Web App URL dan masukkan ke menu Pengaturan Aplikasi

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var data = [];

    if (lastRow >= 2) {
      var rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var idVal = String(row[0] || "").trim();
        var catVal = String(row[2] || "").trim();

        if (idVal !== "SUMMARY" && idVal !== "-" && catVal.toUpperCase().indexOf("TOTAL KESELURUHAN") === -1 && catVal.toLowerCase() !== "kategori") {
          var parseNum = function(val) {
            if (typeof val === "number") return val;
            var s = String(val || "").replace(/[^0-9.-]/g, "");
            return Number(s) || 0;
          };

          var dateStr = "";
          if (row[1] instanceof Date) {
            var d = row[1];
            var yyyy = d.getFullYear();
            var mm = String(d.getMonth() + 1);
            if (mm.length < 2) mm = "0" + mm;
            var dd = String(d.getDate());
            if (dd.length < 2) dd = "0" + dd;
            dateStr = yyyy + "-" + mm + "-" + dd;
          } else if (row[1]) {
            dateStr = String(row[1]).split("T")[0];
          } else {
            dateStr = new Date().toISOString().split("T")[0];
          }

          data.push({
            id: Number(row[0]) || (Date.now() - i),
            date: dateStr,
            category: String(row[2] || "personel").toLowerCase(),
            name: String(row[3] || "KARYAWAN"),
            income: parseNum(row[4]),
            expense: parseNum(row[5]),
            note: String(row[7] || ""),
            syncedToCloud: true
          });
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
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

    // 3. Cek Aksi Hapus atau Tambah/Edit Data
    if (data && data.action === "delete") {
      var targetId = String(data.id || "").trim();
      var currentLastRow = sheet.getLastRow();
      if (currentLastRow >= 2 && targetId) {
        var idRange = sheet.getRange(2, 1, currentLastRow - 1, 1).getValues();
        for (var d = idRange.length - 1; d >= 0; d--) {
          var checkId = String(idRange[d][0] || "").trim();
          if (checkId === targetId) {
            sheet.deleteRow(d + 2);
          }
        }
      }
    } else {
      var items = Array.isArray(data) ? data : [data];

      // Peta ID yang sudah ada di spreadsheet untuk Update/Edit secara presisi
      var updatedLastRow = sheet.getLastRow();
      var existingIdsMap = {};
      if (updatedLastRow >= 2) {
        var idValues = sheet.getRange(2, 1, updatedLastRow - 1, 1).getValues();
        for (var r = 0; r < idValues.length; r++) {
          var rowIdStr = String(idValues[r][0] || "").trim();
          if (rowIdStr && rowIdStr !== "SUMMARY" && rowIdStr !== "-") {
            existingIdsMap[rowIdStr] = r + 2; // Baris di sheet (dimulai dari baris 2)
          }
        }
      }

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item || item.category === "TOTAL KESELURUHAN" || item.id === "SUMMARY") {
          continue;
        }

        var income = Number(item.income || item.totalIncome || 0);
        var expense = Number(item.expense || item.totalExpense || 0);
        var net = Number(item.net || item.totalHasil || (income - expense));
        var itemIdStr = String(item.id || "").trim();

        var rowValues = [
          item.id || Date.now(),
          item.date || new Date().toISOString().split('T')[0],
          (item.category || "Input App").toUpperCase(),
          item.name || "-",
          income,
          expense,
          net,
          item.note || "-",
          new Date().toLocaleString("id-ID")
        ];

        // Jika ID sudah ada di database, UPDATE baris lama!
        if (itemIdStr && existingIdsMap[itemIdStr]) {
          var targetRow = existingIdsMap[itemIdStr];
          sheet.getRange(targetRow, 1, 1, 9).setValues([rowValues]);
        } else {
          // Jika ID belum ada, TAMBAH baris baru di bawah
          sheet.appendRow(rowValues);
          if (itemIdStr) {
            existingIdsMap[itemIdStr] = sheet.getLastRow();
          }
        }
      }
    }

    // 4. Hitung Ulang Grand Total dari seluruh baris data & lampirkan baris TOTAL KESELURUHAN
    var newLastRow = sheet.getLastRow();
    if (newLastRow >= 2) {
      var grandIncome = 0;
      var grandExpense = 0;
      var dataRange = sheet.getRange(2, 1, newLastRow - 1, 9).getValues();

      for (var r = 0; r < dataRange.length; r++) {
        var rowCat = String(dataRange[r][2] || "");
        var rowId = String(dataRange[r][0] || "");
        
        if (rowCat.indexOf("TOTAL KESELURUHAN") === -1 && rowId !== "SUMMARY") {
          var parseVal = function(val) {
            if (typeof val === "number") return val;
            var s = String(val || "").replace(/[^0-9.-]/g, "");
            return Number(s) || 0;
          };
          grandIncome += parseVal(dataRange[r][4]);
          grandExpense += parseVal(dataRange[r][5]);
        }
      }

      var grandNet = grandIncome - grandExpense;

      // Lampirkan Baris Total Hasil Pendapatan dan Pengeluaran Karyawan di baris paling bawah
      sheet.appendRow([
        "-",
        new Date().toISOString().split('T')[0],
        "TOTAL",
        "Total Hasil Pendapatan dan Pengeluaran Karyawan",
        grandIncome,
        grandExpense,
        grandNet,
        "Rekap Otomatis",
        new Date().toLocaleString("id-ID")
      ]);

      var summaryRowIdx = sheet.getLastRow();
      sheet.getRange(summaryRowIdx, 1, 1, 9)
        .setFontWeight("bold")
        .setBackground("#fef08a")
        .setFontColor("#713f12");
    }

    // 5. Otomatis format seluruh kolom nominal (Kolom 5, 6, 7) menjadi Format Rupiah (Rp #,##0)
    var finalLastRow = sheet.getLastRow();
    if (finalLastRow >= 2) {
      sheet.getRange(2, 5, finalLastRow - 1, 3).setNumberFormat('"Rp "#,##0');
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

