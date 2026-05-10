import { createClient } from '@supabase/supabase-js';
import type { Voyage, VoyageTemplate } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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
  const { error } = await supabase
    .from('voyages')
    .upsert({ id: voyage.id, data: voyage }, { onConflict: 'id' });
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
