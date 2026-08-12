import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatRupiah } from './storage';

export const getLogoPngDataUrl = (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 125" width="240" height="250">
        <rect width="120" height="125" rx="16" fill="#FFFFFF"/>
        <rect x="36" y="32" width="13" height="36" rx="1.5" fill="#84CC16"/>
        <rect x="53" y="16" width="13" height="52" rx="1.5" fill="#22C55E"/>
        <rect x="70" y="0" width="13" height="68" rx="1.5" fill="#15803D"/>
        <path d="M 20 44 C 20 64 46 74 74 56 C 82 50 88 42 94 32 L 91 45 L 106 22 L 81 23 L 88 32 C 82 38 76 46 68 50 C 46 64 28 56 20 44 Z" fill="#DC2626"/>
        <path d="M 34 64 C 48 78 74 76 88 58 C 82 72 52 83 34 64 Z" fill="#0F294A"/>
        <text x="60" y="100" text-anchor="middle" fill="#0F294A" font-weight="900" font-size="12.5" font-family="sans-serif" letter-spacing="0.2">ACCOUNTING</text>
        <text x="60" y="114" text-anchor="middle" fill="#DC2626" font-weight="800" font-size="8" font-family="sans-serif" letter-spacing="1.2">FINANCE HERE</text>
      </svg>`;
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 250;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(url);
          resolve('');
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
};

export const exportToPdf = async (
  transactions: Transaction[],
  staffList: string[],
  categoryLabel: string = 'Keseluruhan',
  periodLabel: string = 'Semua Periode'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Try fetching logo PNG DataUrl
  const logoDataUrl = await getLogoPngDataUrl();

  let textX = 14;
  if (logoDataUrl) {
    // Add Logo Image on top left (width: 20mm, height: 20.8mm)
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 8, 20, 20.8);
      textX = 38; // Shift text right to fit logo
    } catch (e) {
      console.warn("Could not render logo in PDF:", e);
      textX = 14;
    }
  }

  // Header Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 74); // Navy Blue
  doc.text('SYSTEM APLIKASI LAPORAN HARIAN DAN BULANAN TIGA BERSAUDARA', textX, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Kategori: ${categoryLabel}   |   Periode: ${periodLabel}   |   Dicetak: ${new Date().toLocaleString('id-ID')}`, textX, 23);

  // Line separator
  doc.setDrawColor(220, 38, 38); // Red 600
  doc.setLineWidth(0.6);
  doc.line(14, 28, 196, 28);

  // Calculate Totals
  let grandIncome = 0;
  let grandExpense = 0;
  transactions.forEach((t) => {
    grandIncome += t.income || 0;
    grandExpense += t.expense || 0;
  });
  const grandNet = grandIncome - grandExpense;

  // Summary Cards Bar
  doc.setFillColor(254, 242, 242); // Red 50
  doc.roundedRect(14, 31, 182, 13, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // Green
  doc.text(`PENDAPATAN: ${formatRupiah(grandIncome)}`, 18, 39);

  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`PENGELUARAN: ${formatRupiah(grandExpense)}`, 85, 39);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`SALDO BERSIH: ${formatRupiah(grandNet)}`, 145, 39);

  // Table Data
  const tableData = transactions.map((t, idx) => [
    (idx + 1).toString(),
    t.date,
    t.category.toUpperCase(),
    t.name,
    t.income > 0 ? formatRupiah(t.income) : '-',
    t.expense > 0 ? formatRupiah(t.expense) : '-',
    formatRupiah((t.income || 0) - (t.expense || 0)),
    t.note || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Tanggal', 'Kategori', 'Subjek / Member / Staff', 'Pendapatan', 'Pengeluaran', 'Saldo Netto', 'Catatan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      font: 'helvetica',
      cellPadding: 2.5,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [185, 28, 28], // Red 700
      textColor: [254, 240, 138], // Yellow 200
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 120;

  // Add Signatures Section
  const signatureY = Math.min(finalY + 15, 250);
  
  if (signatureY < 270) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.text('Petugas Audit Keuangan', 20, signatureY);
    doc.text('Mengetahui / Pimpinan', 140, signatureY);

    doc.line(20, signatureY + 18, 70, signatureY + 18);
    doc.line(140, signatureY + 18, 190, signatureY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ADMINISTRATOR KEUANGAN', 20, signatureY + 22);
    doc.text('DIREKSI SYSTEM APLIKASI', 140, signatureY + 22);
  }

  // Save PDF
  const safeCategory = categoryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_System_Aplikasi_${safeCategory}_${safePeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
