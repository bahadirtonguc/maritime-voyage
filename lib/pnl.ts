import type { Voyage, PnLSummary, VarianceItem } from '@/types';
import { deviationStatus } from './utils';

export function calculateGrossFreight(voyage: Partial<Voyage>): number {
  if (!voyage.cargoes) return 0;
  return voyage.cargoes.reduce((sum, cargo) => {
    const freight =
      cargo.freightType === 'lumpsum'
        ? cargo.freightRate
        : cargo.freightRate * cargo.quantity;
    return sum + freight;
  }, 0);
}

export function calculateTotalBrokerage(voyage: Partial<Voyage>): number {
  if (!voyage.cargoes) return 0;
  return voyage.cargoes.reduce((sum, cargo) => {
    const freight =
      cargo.freightType === 'lumpsum'
        ? cargo.freightRate
        : cargo.freightRate * cargo.quantity;
    return sum + (freight * cargo.brokeragePercent) / 100;
  }, 0);
}

export function calculateTotalProformaCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.costs ?? []).reduce((sum, c) => {
    return sum + c.proformaDa + c.proformaLashing + c.pilotage + c.towage + c.agencyFee + c.otherCosts;
  }, 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.proformaCost, 0);
  return portCosts + canalCosts;
}

export function calculateTotalFinalCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.costs ?? []).reduce((sum, c) => {
    return sum + c.finalDa + c.finalLashing + c.pilotage + c.towage + c.agencyFee + c.otherCosts;
  }, 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.finalCost, 0);
  return portCosts + canalCosts;
}

export function calculatePnL(voyage: Partial<Voyage>): PnLSummary {
  const grossFreight = calculateGrossFreight(voyage);
  const totalBrokerage = calculateTotalBrokerage(voyage);
  const netFreight = grossFreight - totalBrokerage;
  const totalProformaCosts = calculateTotalProformaCosts(voyage);
  const totalFinalCosts = calculateTotalFinalCosts(voyage);
  const netVoyageResult = netFreight - totalFinalCosts;
  const costVariancePercent =
    totalProformaCosts > 0
      ? ((totalFinalCosts - totalProformaCosts) / totalProformaCosts) * 100
      : 0;

  return {
    grossFreight,
    totalBrokerage,
    netFreight,
    totalProformaCosts,
    totalFinalCosts,
    netVoyageResult,
    costVariancePercent,
  };
}

export function buildVarianceItems(voyage: Partial<Voyage>): VarianceItem[] {
  const threshold = voyage.deviationThreshold ?? 5;
  const items: VarianceItem[] = [];

  (voyage.costs ?? []).forEach((c) => {
    const addItem = (label: string, proforma: number, final: number) => {
      if (proforma === 0 && final === 0) return;
      const deviation = proforma > 0 ? ((final - proforma) / proforma) * 100 : 0;
      items.push({
        label,
        portName: c.portName,
        proforma,
        final,
        deviation,
        status: deviationStatus(deviation, threshold),
      });
    };
    addItem('Disbursement Account', c.proformaDa, c.finalDa);
    addItem('Lashing Costs', c.proformaLashing, c.finalLashing);
    if (c.pilotage > 0) addItem('Pilotage', c.pilotage, c.pilotage);
    if (c.towage > 0) addItem('Towage', c.towage, c.towage);
    if (c.agencyFee > 0) addItem('Agency Fee', c.agencyFee, c.agencyFee);
    if (c.otherCosts > 0) addItem('Other Costs', c.otherCosts, c.otherCosts);
  });

  (voyage.canalCosts ?? []).forEach((c) => {
    const label = c.canalType === 'suez' ? 'Suez Canal' : c.canalType === 'bosphorus' ? 'Bosphorus Transit' : 'Dardanelles Transit';
    const deviation = c.proformaCost > 0 ? ((c.finalCost - c.proformaCost) / c.proformaCost) * 100 : 0;
    items.push({
      label,
      portName: 'Canal',
      proforma: c.proformaCost,
      final: c.finalCost,
      deviation,
      status: deviationStatus(deviation, threshold),
    });
  });

  return items;
}
