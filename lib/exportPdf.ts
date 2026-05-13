import type { Voyage } from '@/types';
import { calculatePnL, buildVarianceItems } from './pnl';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export async function exportVoyagePdf(voyage: Voyage): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pnl = calculatePnL(voyage);
  const varianceItems = buildVarianceItems(voyage);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const MARGIN = 18;
  const COL = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_W, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('VOYAGE REPORT', MARGIN, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Maritime Voyage Manager', MARGIN, 21);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, MARGIN, 27);
  y = 40;

  // ── Voyage Info ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VESSEL & VOYAGE INFORMATION', MARGIN, y);
  y += 6;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 5;

  const infoRows = [
    ['Vessel Name', voyage.vesselName],
    ['Voyage Number', voyage.voyageNumber],
    ['Vessel Type', voyage.vesselType],
    ['Vessel Speed', `${voyage.vesselSpeed} knots`],
    ['Laydays Start', voyage.laydaysStart || '—'],
    ['Cancelling Date', voyage.cancellingDate || '—'],
    ['Status', voyage.status.toUpperCase()],
  ];

  doc.setFontSize(9);
  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label + ':', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(value, MARGIN + 52, y);
    y += 5.5;
  });
  y += 4;

  // ── Cargoes ─────────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CARGO DETAILS', MARGIN, y);
  y += 6;
  doc.setDrawColor(59, 130, 246);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 5;

  voyage.cargoes.forEach((cargo, i) => {
    const grossFreight = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
    const brokerage = (grossFreight * cargo.brokeragePercent) / 100;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`Cargo #${i + 1}: ${cargo.cargoType.charAt(0).toUpperCase() + cargo.cargoType.slice(1)}`, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const cargoRows = [
      ['Charterer', cargo.chartererName],
      ['Quantity', `${cargo.quantity.toLocaleString()} MT`],
      ['Freight', cargo.freightType === 'lumpsum' ? `${fmt(cargo.freightRate)} lumpsum` : `${fmt(cargo.freightRate)}/MT`],
      ['Gross Freight', fmt(grossFreight)],
      ['Brokerage', `${cargo.brokeragePercent}% = ${fmt(brokerage)}`],
    ];
    cargoRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label + ':', MARGIN + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(value, MARGIN + 52, y);
      y += 5;
    });
    y += 2;
  });
  y += 2;

  // ── Port Rotation ───────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PORT ROTATION', MARGIN, y);
  y += 6;
  doc.setDrawColor(59, 130, 246);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 5;

  voyage.portRotation.forEach((pc, i) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`${i + 1}.`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const roleColor = pc.role === 'load' ? [34, 197, 94] : pc.role === 'discharge' ? [239, 68, 68] : [245, 158, 11];
    doc.setTextColor(roleColor[0], roleColor[1], roleColor[2]);
    doc.text(`[${pc.role.toUpperCase()}]`, MARGIN + 6, y);
    doc.setTextColor(30, 41, 59);
    doc.text(pc.portName, MARGIN + 24, y);
    if (pc.eta) doc.text(`ETA: ${pc.eta}`, MARGIN + 100, y);
    if (pc.isBosphorus || pc.isDardanelles || pc.isSuez) {
      doc.setTextColor(245, 158, 11);
      doc.text('⚠ Strait', MARGIN + 150, y);
      doc.setTextColor(30, 41, 59);
    }
    y += 5.5;
  });
  y += 4;

  // ── P&L Summary ─────────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = MARGIN; }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('P&L SUMMARY', MARGIN, y);
  y += 6;
  doc.setDrawColor(59, 130, 246);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 5;

  const pnlRows: [string, string, boolean?][] = [
    ['Freight In', fmt(pnl.freightIn)],
    ['Freight Out', `(${fmt(pnl.freightOut)})`],
    ['Gross Margin', fmt(pnl.grossMargin), true],
    ['Total Proforma Costs', `(${fmt(pnl.totalProformaCosts)})`],
    ['Total Final Costs', `(${fmt(pnl.totalFinalCosts)})`],
    ['Cost Variance', `${pnl.costVariancePercent >= 0 ? '+' : ''}${pnl.costVariancePercent.toFixed(1)}%`],
  ];

  doc.setFontSize(9);
  pnlRows.forEach(([label, value, bold]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 30 : 100, bold ? 41 : 116, bold ? 59 : 139);
    doc.text(label, MARGIN, y);
    doc.setTextColor(30, 41, 59);
    doc.text(value, PAGE_W - MARGIN - doc.getTextWidth(value), y);
    y += 5.5;
  });

  // Net Result box
  y += 2;
  const resultColor = pnl.netVoyageResult >= 0 ? [34, 197, 94] : [239, 68, 68];
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.setFillColor(resultColor[0], resultColor[1], resultColor[2]);
  doc.roundedRect(MARGIN, y, COL, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET VOYAGE RESULT', MARGIN + 4, y + 7.5);
  const resultText = fmt(pnl.netVoyageResult);
  doc.text(resultText, PAGE_W - MARGIN - doc.getTextWidth(resultText) - 4, y + 7.5);
  y += 18;

  // ── Variance Analysis ────────────────────────────────────────────────────
  if (varianceItems.length > 0) {
    if (y > 220) { doc.addPage(); y = MARGIN; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('VARIANCE ANALYSIS', MARGIN, y);
    y += 6;
    doc.setDrawColor(59, 130, 246);
    doc.line(MARGIN, y, MARGIN + COL, y);
    y += 5;

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(MARGIN, y, COL, 7, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PORT', MARGIN + 2, y + 4.5);
    doc.text('ITEM', MARGIN + 38, y + 4.5);
    doc.text('PROFORMA', MARGIN + 88, y + 4.5);
    doc.text('FINAL', MARGIN + 118, y + 4.5);
    doc.text('DEV %', MARGIN + 148, y + 4.5);
    y += 9;

    varianceItems.forEach((item, idx) => {
      if (y > 270) { doc.addPage(); y = MARGIN; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(MARGIN, y - 1, COL, 6, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(item.portName.slice(0, 16), MARGIN + 2, y + 3);
      doc.text(item.label.slice(0, 22), MARGIN + 38, y + 3);
      doc.text(fmt(item.proforma), MARGIN + 88, y + 3);
      doc.text(fmt(item.final), MARGIN + 118, y + 3);
      const devText = `${item.deviation >= 0 ? '+' : ''}${item.deviation.toFixed(1)}%`;
      const devColor = item.status === 'ok' ? [34, 197, 94] : item.status === 'warning' ? [245, 158, 11] : [239, 68, 68];
      doc.setTextColor(devColor[0], devColor[1], devColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(devText, MARGIN + 148, y + 3);
      y += 6;
    });
  }

  // ── Remarks ─────────────────────────────────────────────────────────────
  if (voyage.remarks) {
    if (y > 240) { doc.addPage(); y = MARGIN; }
    y += 4;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('REMARKS', MARGIN, y);
    y += 6;
    doc.setDrawColor(59, 130, 246);
    doc.line(MARGIN, y, MARGIN + COL, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(voyage.remarks, COL);
    doc.text(lines, MARGIN, y);
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 285, PAGE_W, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Maritime Voyage Manager — Confidential', MARGIN, 291);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN - 16, 291);
  }

  doc.save(`${voyage.voyageNumber}-report.pdf`);
}
