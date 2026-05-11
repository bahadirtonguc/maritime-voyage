import type { Voyage, PnLSummary, VarianceItem } from '@/types';
import { deviationStatus } from './utils';

export function calculateGrossFreight(voyage: Partial<Voyage>): number {
  if (!voyage.cargoes) return 0;
  return voyage.cargoes.reduce((sum, cargo) => {
    const freight = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
    return sum + freight;
  }, 0);
}

export function calculateTotalBrokerage(voyage: Partial<Voyage>): number {
  if (!voyage.cargoes) return 0;
  return voyage.cargoes.reduce((sum, cargo) => {
    const freight = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
    return sum + (freight * cargo.brokeragePercent) / 100;
  }, 0);
}

export function calculateTotalProformaCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.costs ?? []).reduce((sum, c) =>
    sum + c.proformaDa + c.proformaPilotage + c.proformaTowage + c.proformaAgencyFee + c.proformaOther, 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.proformaCost, 0);
  const cargoCosts = (voyage.cargoes ?? []).reduce((sum, c) =>
    sum + (c.lashingProforma ?? 0) + (c.otherCostsProforma ?? 0), 0);
  return portCosts + canalCosts + cargoCosts;
}

export function calculateTotalFinalCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.costs ?? []).reduce((sum, c) =>
    sum + c.finalDa + c.finalPilotage + c.finalTowage + c.finalAgencyFee + c.finalOther, 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.finalCost, 0);
  const cargoCosts = (voyage.cargoes ?? []).reduce((sum, c) =>
    sum + (c.lashingFinal ?? 0) + (c.otherCostsFinal ?? 0), 0);
  return portCosts + canalCosts + cargoCosts;
}

export function calculatePnL(voyage: Partial<Voyage>): PnLSummary {
  const grossFreight = calculateGrossFreight(voyage);
  const totalBrokerage = calculateTotalBrokerage(voyage);
  const netFreight = grossFreight - totalBrokerage;
  const totalProformaCosts = calculateTotalProformaCosts(voyage);
  const totalFinalCosts = calculateTotalFinalCosts(voyage);
  const netVoyageResult = netFreight - totalFinalCosts;
  const costVariancePercent = totalProformaCosts > 0
    ? ((totalFinalCosts - totalProformaCosts) / totalProformaCosts) * 100
    : 0;

  return { grossFreight, totalBrokerage, netFreight, totalProformaCosts, totalFinalCosts, netVoyageResult, costVariancePercent };
}

export function buildVarianceItems(voyage: Partial<Voyage>): VarianceItem[] {
  const threshold = voyage.deviationThreshold ?? 5;
  const items: VarianceItem[] = [];

  const addItem = (label: string, portName: string, proforma: number, final: number) => {
    if (proforma === 0 && final === 0) return;
    const deviation = proforma > 0 ? ((final - proforma) / proforma) * 100 : 0;
    items.push({ label, portName, proforma, final, deviation, status: deviationStatus(deviation, threshold) });
  };

  (voyage.costs ?? []).forEach((c) => {
    addItem('Disbursement Account', c.portName, c.proformaDa, c.finalDa);
    addItem('Pilotage', c.portName, c.proformaPilotage, c.finalPilotage);
    addItem('Towage', c.portName, c.proformaTowage, c.finalTowage);
    addItem('Agency Fee', c.portName, c.proformaAgencyFee, c.finalAgencyFee);
    addItem('Other', c.portName, c.proformaOther, c.finalOther);
  });

  (voyage.cargoes ?? []).forEach((c) => {
    const label = `${c.cargoType} (${c.chartererName || 'cargo'})`;
    addItem('Lashing', label, c.lashingProforma ?? 0, c.lashingFinal ?? 0);
    addItem('Other Cargo Costs', label, c.otherCostsProforma ?? 0, c.otherCostsFinal ?? 0);
  });

  (voyage.canalCosts ?? []).forEach((c) => {
    const label = c.canalType === 'suez' ? 'Suez Canal' : c.canalType === 'bosphorus' ? 'Bosphorus' : 'Dardanelles';
    addItem(label, 'Canal', c.proformaCost, c.finalCost);
  });

  return items;
}
