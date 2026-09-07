export interface RegistrationPass {
  id: string;
  event_id: string;
  event_title: string;
  event_banner_url?: string | null;
  event_venue_name: string;
  event_address?: string | null;
  event_start_time: string;
  event_end_time: string;
  event_source_url?: string | null;
  category?: string;
  state_id?: string;
  qr_code_token?: string;
  reference?: string;
  registration_status?: string;
  created_at?: string;
}

const STORAGE_KEY = "eventdek_cached_passes";
const TIMESTAMP_KEY = "eventdek_passes_synced_at";

export function getCachedPasses(): RegistrationPass[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePassesToCache(passes: RegistrationPass[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn("Failed to write passes to offline cache:", err);
  }
}

export function getLastPassSyncTime(): string | null {
  return localStorage.getItem(TIMESTAMP_KEY);
}
