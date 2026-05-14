import { createClient } from '@supabase/supabase-js';
import type { Voyage, VoyageTemplate } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── Permission types ────────────────────────────────────────────────────────
export type VoyagePerm = 'view' | 'edit';
export interface VoyagePermEntry {
  id: string;
  voyage_id: string;
  username: string;
  permission: VoyagePerm;
  granted_at: string;
}

// ── Permission helpers ───────────────────────────────────────────────────────

/** All permissions for a single voyage (admin panel use). */
export async function getVoyagePermissions(voyageId: string): Promise<VoyagePermEntry[]> {
  const { data } = await supabase
    .from('voyage_permissions')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('granted_at', { ascending: true });
  return (data ?? []) as VoyagePermEntry[];
}

/** Check what permission a user has for a voyage. Returns null if none. */
export async function getUserVoyagePerm(voyageId: string, username: string): Promise<VoyagePerm | null> {
  const { data } = await supabase
    .from('voyage_permissions')
    .select('permission')
    .eq('voyage_id', voyageId)
    .eq('username', username)
    .single();
  return (data?.permission as VoyagePerm) ?? null;
}

/** Grant or update a user's permission for a voyage. */
export async function setVoyagePermission(voyageId: string, username: string, permission: VoyagePerm): Promise<void> {
  const { error } = await supabase
    .from('voyage_permissions')
    .upsert({ voyage_id: voyageId, username, permission }, { onConflict: 'voyage_id,username' });
  if (error) throw error;
}

/** Revoke a user's access to a voyage. */
export async function removeVoyagePermission(voyageId: string, username: string): Promise<void> {
  await supabase
    .from('voyage_permissions')
    .delete()
    .eq('voyage_id', voyageId)
    .eq('username', username);
}

/** Get all voyage IDs a user has any permission for. */
export async function getUserPermittedVoyageIds(username: string): Promise<string[]> {
  const { data } = await supabase
    .from('voyage_permissions')
    .select('voyage_id')
    .eq('username', username);
  return (data ?? []).map((r) => r.voyage_id as string);
}

// Voyages
export async function getVoyages(): Promise<Voyage[]> {
  const { data, error } = await supabase
    .from('voyages')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Voyage);
}

export async function getVoyage(id: string): Promise<Voyage | undefined> {
  const { data, error } = await supabase
    .from('voyages')
    .select('data')
    .eq('id', id)
    .single();
  if (error) return undefined;
  return data?.data as Voyage;
}

export async function saveVoyage(voyage: Voyage): Promise<void> {
  // Deduplicate portRotation by portName+role — when there are duplicates, merge
  // their cost fields (summing numeric values) so no entered data is ever lost.
  const portMergeMap = new Map<string, typeof voyage.portRotation[0]>();
  for (const p of voyage.portRotation ?? []) {
    const key = `${p.portName}||${p.role}`;
    const existing = portMergeMap.get(key);
    if (!existing) {
      portMergeMap.set(key, { ...p });
    } else {
      // Merge: for every numeric cost key, take the max (prefer a non-zero value over zero)
      const merged = { ...existing };
      const costKeys = [
        'proformaDa','finalDa','proformaPilotage','finalPilotage',
        'proformaTowage','finalTowage','proformaAgencyFee','finalAgencyFee',
        'proformaOther','finalOther','lashingProforma','lashingFinal',
        'otherCostsProforma','otherCostsFinal','proformaFacilitation','finalFacilitation',
        'proformaArmedGuards','finalArmedGuards','proformaEwri','finalEwri',
        'proformaAdditionalInsurance','finalAdditionalInsurance',
        'proformaSurveyInspection','finalSurveyInspection',
      ] as const;
      for (const k of costKeys) {
        const ev = (existing[k] ?? 0) as number;
        const pv = (p[k] ?? 0) as number;
        // Keep whichever is non-zero; if both non-zero, prefer the newer (p) value
        (merged as Record<string, unknown>)[k] = pv !== 0 ? pv : ev;
      }
      // Also prefer non-empty string fields from the newer entry
      if (p.agentCompany) merged.agentCompany = p.agentCompany;
      if (p.agentName) merged.agentName = p.agentName;
      if (p.agentEmail) merged.agentEmail = p.agentEmail;
      if (p.agentPhone) merged.agentPhone = p.agentPhone;
      if (p.eta) merged.eta = p.eta;
      if (p.etd) merged.etd = p.etd;
      if (p.ata) merged.ata = p.ata;
      if (p.atd) merged.atd = p.atd;
      portMergeMap.set(key, merged);
    }
  }
  const deduplicatedPortRotation = Array.from(portMergeMap.values());

  // Legacy `costs` array is no longer used — all costs live on portRotation entries.
  // Clearing it prevents phantom rows from ever reappearing on the detail page.
  const cleanVoyage: Voyage = {
    ...voyage,
    portRotation: deduplicatedPortRotation,
    costs: [],
  };

  const { error } = await supabase
    .from('voyages')
    .upsert({ id: cleanVoyage.id, data: cleanVoyage }, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteVoyage(id: string): Promise<void> {
  const { error } = await supabase.from('voyages').delete().eq('id', id);
  if (error) throw error;
}

// Templates
export async function getTemplates(): Promise<VoyageTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as VoyageTemplate);
}

export async function saveTemplate(template: VoyageTemplate): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .upsert({ id: template.id, data: template }, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw error;
}
