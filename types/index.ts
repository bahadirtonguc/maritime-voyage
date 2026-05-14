export type VoyageStatus = 'planned' | 'active' | 'completed' | 'closed';
export type PortRole = 'load' | 'discharge' | 'transit';
export type FreightType = 'per_mt' | 'lumpsum';
export type CargoType = 'grain' | 'steel' | 'coal' | 'fertilizer' | 'cement' | 'timber' | 'containers' | 'bulk' | 'other';

export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  isBosphorus?: boolean;
  isDardanelles?: boolean;
  isSuez?: boolean;
}

export interface CargoPort {
  portName: string;
}

export interface Cargo {
  id: string;
  cargoType: CargoType;
  commodity?: string;
  blNumber?: string;
  quantity: number;
  loadingPorts: string[];
  dischargingPorts: string[];
  loadingPortDAs: CargoPort[];
  dischargingPortDAs: CargoPort[];
  linkedLoadPort?: string;
  linkedDischargePort?: string;
  chartererName: string;
  chartererAddress: string;
  freightRate: number;
  freightType: FreightType;
  brokeragePercent: number;
  freightPayable?: number;
  lashingProforma: number;
  lashingFinal: number;
  otherCostsProforma: number;
  otherCostsFinal: number;
}

export interface PortCall {
  id: string;
  portId: string;
  portName: string;
  role: PortRole;
  country?: string;
  lat?: number;
  lng?: number;
  agentCompany?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  eta: string;
  etd: string;
  ata?: string;
  atd?: string;
  isBosphorus?: boolean;
  isDardanelles?: boolean;
  isSuez?: boolean;
  // Costs — all entered inline in port rotation step
  proformaDa?: number;
  finalDa?: number;
  proformaPilotage?: number;
  finalPilotage?: number;
  proformaTowage?: number;
  finalTowage?: number;
  proformaAgencyFee?: number;
  finalAgencyFee?: number;
  proformaOther?: number;
  finalOther?: number;
  lashingProforma?: number;
  lashingFinal?: number;
  otherCostsProforma?: number;
  otherCostsFinal?: number;
  proformaFacilitation?: number;
  finalFacilitation?: number;
  proformaArmedGuards?: number;
  finalArmedGuards?: number;
  proformaEwri?: number;
  finalEwri?: number;
  proformaAdditionalInsurance?: number;
  finalAdditionalInsurance?: number;
  proformaSurveyInspection?: number;
  finalSurveyInspection?: number;
  distanceToNextPort?: number;
  portDocuments?: { name: string; url: string; uploadedAt: string }[];
}

export interface CostEntry {
  id: string;
  portCallId: string;
  portName: string;
  proformaDa: number;
  finalDa: number;
  proformaPilotage: number;
  finalPilotage: number;
  proformaTowage: number;
  finalTowage: number;
  proformaAgencyFee: number;
  finalAgencyFee: number;
  proformaOther: number;
  finalOther: number;
}

export interface CanalCost {
  id: string;
  canalType: 'suez' | 'bosphorus' | 'dardanelles';
  proformaCost: number;
  finalCost: number;
  agentCompany?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  canalDocuments?: { name: string; url: string; uploadedAt: string }[];
}

export interface Document {
  id: string;
  name: string;
  type: 'bl' | 'cp' | 'nor' | 'other';
  uploadedAt: string;
  size: number;
  dataUrl?: string;
}

export interface PnLSummary {
  freightIn: number;
  freightOut: number;
  grossMargin: number;
  totalProformaCosts: number;
  totalFinalCosts: number;
  netVoyageResult: number;
  costVariancePercent: number;
}

export interface Voyage {
  id: string;
  voyageNumber: string;
  vesselName: string;
  vesselType: string;
  vesselSpeed: number;
  imoNumber?: string;
  flag?: string;
  dwt?: number;
  builtYear?: number;
  piClub?: string;
  hmInsurer?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  freightIn?: number;
  freightOut?: number;
  laydaysStart: string;
  cancellingDate: string;
  status: VoyageStatus;
  cargoes: Cargo[];
  portRotation: PortCall[];
  costs: CostEntry[];
  canalCosts: CanalCost[];
  deviationThreshold: number;
  remarks: string;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
  templateName?: string;
}

export interface VoyageTemplate {
  id: string;
  name: string;
  voyage: Omit<Voyage, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
  createdAt: string;
}

export interface VarianceItem {
  label: string;
  portName: string;
  proforma: number;
  final: number;
  deviation: number;
  status: 'ok' | 'warning' | 'danger';
  voyageName?: string;
}

export interface User {
  username: string;
  password: string;
  name: string;
}

export interface DashboardKPIs {
  netVoyageResult: number;
  netVoyageResultChange: number;
  activeVoyages: number;
  costVariancePercent: number;
  totalBrokerage: number;
}

export interface WizardState {
  step: number;
  voyage: Partial<Voyage>;
}
