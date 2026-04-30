import fs from "fs";
import path from "path";

export type Lead = {
  id: number;
  name: string;
  business: string;
  website: string;
  rating: number | null;
  issues: string;
  score: number | null;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "leads.json");

function ensureFile(): void {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

export function readLeads(): Lead[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8")) as Lead[];
  } catch {
    return [];
  }
}

export function writeLeads(leads: Lead[]): void {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export function addLead(data: Omit<Lead, "id" | "createdAt">): Lead {
  const leads = readLeads();
  const next: Lead = {
    ...data,
    id: leads.length > 0 ? Math.max(...leads.map((l) => l.id)) + 1 : 1,
    createdAt: new Date().toISOString(),
  };
  leads.unshift(next);
  writeLeads(leads);
  return next;
}

export function updateLead(id: number, patch: Partial<Omit<Lead, "id" | "createdAt">>): Lead | null {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...patch };
  writeLeads(leads);
  return leads[idx];
}
