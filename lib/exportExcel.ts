import type { Voyage } from '@/types';
import { calculatePnL, buildVarianceItems } from './pnl';

export async function exportVoyageExcel(voyage: Voyage): Promise<void> {
  const XLSX = await import('xlsx');
  const pnl = calculatePnL(voyage);
  const varianceItems = buildVarianceItems(voyage);
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: P&L Summary ─────────────────────────────────────────────────
  const pnlData = [
    ['Maritime Voyage Manager — P&L Summary', '', ''],
    ['', '', ''],
    ['Vessel', voyage.vesselName, ''],
    ['Voyage Number', voyage.voyageNumber, ''],
    ['Status', voyage.status, ''],
    ['Generated', new Date().toLocaleDateString('en-GB'), ''],
    ['', '', ''],
    ['P&L ITEM', 'AMOUNT (USD)', ''],
    ['Gross Freight', pnl.grossFreight, ''],
    ['Total Brokerage', -pnl.totalBrokerage, ''],
    ['Net Freight', pnl.netFreight, ''],
    ['Total Proforma Costs', -pnl.totalProformaCosts, ''],
    ['Total Final Costs', -pnl.totalFinalCosts, ''],
    ['Cost Variance %', pnl.costVariancePercent / 100, ''],
    ['', '', ''],
    ['NET VOYAGE RESULT', pnl.netVoyageResult, ''],
  ];
  const wsPnL = XLSX.utils.aoa_to_sheet(pnlData);
  wsPnL['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsPnL, 'P&L Summary');

  // ── Sheet 2: Variance Analysis ───────────────────────────────────────────
  const varHeader = ['Port', 'Cost Item', 'Proforma (USD)', 'Final (USD)', 'Deviation (USD)', 'Deviation %', 'Status'];
  const varRows = varianceItems.map((item) => [
    item.portName,
    item.label,
    item.proforma,
    item.final,
    item.final - item.proforma,
    item.deviation / 100,
    item.status.toUpperCase(),
  ]);
  const wsVar = XLSX.utils.aoa_to_sheet([varHeader, ...varRows]);
  wsVar['!cols'] = [{ wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsVar, 'Variance Analysis');

  // ── Sheet 3: Port Costs ──────────────────────────────────────────────────
  const costsHeader = ['Port', 'Role', 'Proforma D/A', 'Final D/A', 'Pro. Lashing', 'Final Lashing', 'Pilotage', 'Towage', 'Agency Fee', 'Other', 'Total Proforma', 'Total Final'];
  const costsRows = voyage.costs.map((c) => {
    const portCall = voyage.portRotation.find((p) => p.id === c.portCallId);
    return [
      c.portName,
      portCall?.role ?? '',
      c.proformaDa,
      c.finalDa,
      c.proformaLashing,
      c.finalLashing,
      c.pilotage,
      c.towage,
      c.agencyFee,
      c.otherCosts,
      c.proformaDa + c.proformaLashing + c.pilotage + c.towage + c.agencyFee + c.otherCosts,
      c.finalDa + c.finalLashing + c.pilotage + c.towage + c.agencyFee + c.otherCosts,
    ];
  });
  const canalRows = voyage.canalCosts.map((c) => [
    `${c.canalType.charAt(0).toUpperCase() + c.canalType.slice(1)} Canal`,
    'transit',
    c.proformaCost, c.finalCost,
    0, 0, 0, 0, 0, 0,
    c.proformaCost, c.finalCost,
  ]);
  const wsCosts = XLSX.utils.aoa_to_sheet([costsHeader, ...costsRows, ...canalRows]);
  wsCosts['!cols'] = Array(12).fill({ wch: 14 });
  XLSX.utils.book_append_sheet(wb, wsCosts, 'Port Costs');

  // ── Sheet 4: Cargoes ─────────────────────────────────────────────────────
  const cargoHeader = ['#', 'Type', 'Quantity (MT)', 'Charterer', 'Freight Type', 'Rate', 'Gross Freight', 'Brokerage %', 'Brokerage Amount', 'Net Freight'];
  const cargoRows = voyage.cargoes.map((c, i) => {
    const gross = c.freightType === 'lumpsum' ? c.freightRate : c.freightRate * c.quantity;
    const brok = (gross * c.brokeragePercent) / 100;
    return [i + 1, c.cargoType, c.quantity, c.chartererName, c.freightType, c.freightRate, gross, c.brokeragePercent / 100, brok, gross - brok];
  });
  const wsCargo = XLSX.utils.aoa_to_sheet([cargoHeader, ...cargoRows]);
  wsCargo['!cols'] = Array(10).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, wsCargo, 'Cargoes');

  XLSX.writeFile(wb, `${voyage.voyageNumber}-costs.xlsx`);
}
