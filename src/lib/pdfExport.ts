import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatRupiah } from './storage';

export const exportToPdf = (
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

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red 600
  doc.text('TIGA BERSAUDARA PUSAT', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('LAPORAN HARIAN DAN BULANAN TIGA BERSAUDARA', 14, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Kategori: ${categoryLabel}   |   Periode: ${periodLabel}   |   Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 27);

  // Line separator
  doc.setDrawColor(220, 38, 38); // Red 600
  doc.setLineWidth(0.6);
  doc.line(14, 30, 196, 30);

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
  doc.roundedRect(14, 33, 182, 14, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // Green
  doc.text(`PENDAPATAN: ${formatRupiah(grandIncome)}`, 18, 41);

  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`PENGELUARAN: ${formatRupiah(grandExpense)}`, 85, 41);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`SALDO BERSIH: ${formatRupiah(grandNet)}`, 145, 41);

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
    startY: 51,
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
    doc.text('ADMINISTRATOR TIGA BERSAUDARA', 20, signatureY + 22);
    doc.text('DIREKSI TIGA BERSAUDARA', 140, signatureY + 22);
  }

  // Save PDF
  const safeCategory = categoryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Tiga_Bersaudara_${safeCategory}_${safePeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
