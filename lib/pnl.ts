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
  // New: costs live on portRotation directly
  const portCosts = (voyage.portRotation ?? []).reduce((sum, p) =>
    sum + (p.proformaDa ?? 0)
        + (p.proformaPilotage ?? 0)
        + (p.proformaTowage ?? 0)
        + (p.proformaAgencyFee ?? 0)
        + (p.proformaOther ?? 0)
        + (p.lashingProforma ?? 0)
        + (p.otherCostsProforma ?? 0)
        + (p.proformaFacilitation ?? 0)
        + (p.proformaArmedGuards ?? 0)
        + (p.proformaEwri ?? 0)
        + (p.proformaAdditionalInsurance ?? 0)
        + (p.proformaSurveyInspection ?? 0), 0);
  // Backward compat: old data stored costs in separate costs array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyCosts = (voyage.costs ?? []).reduce((sum, c: any) =>
    sum + (c.proformaDa ?? 0)
        + (c.proformaPilotage ?? c.pilotage ?? 0)
        + (c.proformaTowage ?? c.towage ?? 0)
        + (c.proformaAgencyFee ?? c.agencyFee ?? 0)
        + (c.proformaOther ?? c.otherCosts ?? 0), 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.proformaCost, 0);
  return portCosts + legacyCosts + canalCosts;
}

export function calculateTotalFinalCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.portRotation ?? []).reduce((sum, p) =>
    sum + (p.finalDa ?? 0)
        + (p.finalPilotage ?? 0)
        + (p.finalTowage ?? 0)
        + (p.finalAgencyFee ?? 0)
        + (p.finalOther ?? 0)
        + (p.lashingFinal ?? 0)
        + (p.otherCostsFinal ?? 0)
        + (p.finalFacilitation ?? 0)
        + (p.finalArmedGuards ?? 0)
        + (p.finalEwri ?? 0)
        + (p.finalAdditionalInsurance ?? 0)
        + (p.finalSurveyInspection ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyCosts = (voyage.costs ?? []).reduce((sum, c: any) =>
    sum + (c.finalDa ?? 0)
        + (c.finalPilotage ?? c.pilotage ?? 0)
        + (c.finalTowage ?? c.towage ?? 0)
        + (c.finalAgencyFee ?? c.agencyFee ?? 0)
        + (c.finalOther ?? c.otherCosts ?? 0), 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) => sum + c.finalCost, 0);
  return portCosts + legacyCosts + canalCosts;
}

export function calculatePnL(voyage: Partial<Voyage>): PnLSummary {
  const freightIn = voyage.freightIn ?? 0;
  const freightOut = voyage.freightOut ?? 0;
  const grossMargin = freightIn - freightOut;
  const totalProformaCosts = calculateTotalProformaCosts(voyage);
  const totalFinalCosts = calculateTotalFinalCosts(voyage);
  // Use final costs where available, fall back to proforma per-port
  const effectiveCosts = smartEffectiveCosts(voyage);
  const netVoyageResult = grossMargin - effectiveCosts;
  const costVariancePercent = totalProformaCosts > 0
    ? ((totalFinalCosts - totalProformaCosts) / totalProformaCosts) * 100
    : 0;
  return { freightIn, freightOut, grossMargin, totalProformaCosts, totalFinalCosts, netVoyageResult, costVariancePercent };
}

function smartEffectiveCosts(voyage: Partial<Voyage>): number {
  const portCosts = (voyage.portRotation ?? []).reduce((sum, p) => {
    const fin = (p.finalDa ?? 0) + (p.finalPilotage ?? 0) + (p.finalTowage ?? 0) + (p.finalAgencyFee ?? 0)
      + (p.finalOther ?? 0) + (p.lashingFinal ?? 0) + (p.otherCostsFinal ?? 0)
      + (p.finalFacilitation ?? 0) + (p.finalArmedGuards ?? 0) + (p.finalEwri ?? 0)
      + (p.finalAdditionalInsurance ?? 0) + (p.finalSurveyInspection ?? 0);
    const pro = (p.proformaDa ?? 0) + (p.proformaPilotage ?? 0) + (p.proformaTowage ?? 0)
      + (p.proformaAgencyFee ?? 0) + (p.proformaOther ?? 0) + (p.lashingProforma ?? 0)
      + (p.otherCostsProforma ?? 0) + (p.proformaFacilitation ?? 0) + (p.proformaArmedGuards ?? 0)
      + (p.proformaEwri ?? 0) + (p.proformaAdditionalInsurance ?? 0) + (p.proformaSurveyInspection ?? 0);
    return sum + (fin > 0 ? fin : pro);
  }, 0);
  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) =>
    sum + (c.finalCost > 0 ? c.finalCost : c.proformaCost), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyCosts = (voyage.costs ?? []).reduce((sum, c: any) =>
    sum + (c.finalDa ?? c.proformaDa ?? 0) + (c.finalPilotage ?? c.proformaPilotage ?? 0)
        + (c.finalTowage ?? c.proformaTowage ?? 0) + (c.finalAgencyFee ?? c.proformaAgencyFee ?? 0)
        + (c.finalOther ?? c.proformaOther ?? 0), 0);
  return portCosts + canalCosts + legacyCosts;
}

export function buildVarianceItems(voyage: Partial<Voyage>): VarianceItem[] {
  const threshold = voyage.deviationThreshold ?? 5;
  const items: VarianceItem[] = [];

  const addItem = (label: string, portName: string, proforma: number, final: number) => {
    if (proforma === 0 && final === 0) return;
    const deviation = proforma > 0 ? ((final - proforma) / proforma) * 100 : 0;
    items.push({ label, portName, proforma, final, deviation, status: deviationStatus(deviation, threshold) });
  };

  (voyage.portRotation ?? []).forEach((p) => {
    addItem('D/A', p.portName, p.proformaDa ?? 0, p.finalDa ?? 0);
    addItem('Pilotage', p.portName, p.proformaPilotage ?? 0, p.finalPilotage ?? 0);
    addItem('Towage', p.portName, p.proformaTowage ?? 0, p.finalTowage ?? 0);
    addItem('Agency Fee', p.portName, p.proformaAgencyFee ?? 0, p.finalAgencyFee ?? 0);
    addItem('Other', p.portName, p.proformaOther ?? 0, p.finalOther ?? 0);
    addItem('Lashing', p.portName, p.lashingProforma ?? 0, p.lashingFinal ?? 0);
    addItem('Other (Securing)', p.portName, p.otherCostsProforma ?? 0, p.otherCostsFinal ?? 0);
    addItem('Facilitation', p.portName, p.proformaFacilitation ?? 0, p.finalFacilitation ?? 0);
    addItem('Armed Guards', p.portName, p.proformaArmedGuards ?? 0, p.finalArmedGuards ?? 0);
    addItem('EWRI', p.portName, p.proformaEwri ?? 0, p.finalEwri ?? 0);
    addItem('Addl. Insurance', p.portName, p.proformaAdditionalInsurance ?? 0, p.finalAdditionalInsurance ?? 0);
    addItem('Survey/Inspection', p.portName, p.proformaSurveyInspection ?? 0, p.finalSurveyInspection ?? 0);
  });
  // Backward compat: legacy costs array
  (voyage.costs ?? []).forEach((c) => {
    addItem('D/A', c.portName, c.proformaDa, c.finalDa);
    addItem('Pilotage', c.portName, c.proformaPilotage, c.finalPilotage);
    addItem('Towage', c.portName, c.proformaTowage, c.finalTowage);
    addItem('Agency Fee', c.portName, c.proformaAgencyFee, c.finalAgencyFee);
    addItem('Other', c.portName, c.proformaOther, c.finalOther);
  });

  (voyage.canalCosts ?? []).forEach((c) => {
    const label = c.canalType === 'suez' ? 'Suez Canal' : c.canalType === 'bosphorus' ? 'Bosphorus' : 'Dardanelles';
    addItem(label, 'Canal', c.proformaCost, c.finalCost);
  });

  return items;
}
