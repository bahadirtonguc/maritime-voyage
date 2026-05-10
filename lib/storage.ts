import fs from 'fs';
import path from 'path';
import type { Voyage, VoyageTemplate } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJson<T>(filename: string): T {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [] as unknown as T;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

function writeJson<T>(filename: string, data: T): void {
  const file = path.join(DATA_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Voyages
export function getVoyages(): Voyage[] {
  return readJson<Voyage[]>('voyages.json');
}

export function getVoyage(id: string): Voyage | undefined {
  return getVoyages().find((v) => v.id === id);
}

export function saveVoyage(voyage: Voyage): void {
  const voyages = getVoyages();
  const idx = voyages.findIndex((v) => v.id === voyage.id);
  if (idx >= 0) {
    voyages[idx] = voyage;
  } else {
    voyages.push(voyage);
  }
  writeJson('voyages.json', voyages);
}

export function deleteVoyage(id: string): void {
  const voyages = getVoyages().filter((v) => v.id !== id);
  writeJson('voyages.json', voyages);
}

// Templates
export function getTemplates(): VoyageTemplate[] {
  return readJson<VoyageTemplate[]>('templates.json');
}

export function saveTemplate(template: VoyageTemplate): void {
  const templates = getTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  writeJson('templates.json', templates);
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter((t) => t.id !== id);
  writeJson('templates.json', templates);
}
