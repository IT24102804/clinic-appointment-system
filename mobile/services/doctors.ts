import { API_BASE_URL } from "@/constants/api";

function toApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function request(path: string, options?: RequestInit) {
  const res = await fetch(toApiUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data;
}

async function requestForm(path: string, method: string, formData: FormData) {
  const res = await fetch(toApiUrl(path), { method, body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data;
}

export const listDoctors  = () => request("/api/doctors");
export const getDoctor    = (id: string) => request(`/api/doctors/${id}`);
export const createDoctor = (formData: FormData) => requestForm("/api/doctors", "POST", formData);
export const updateDoctor = (id: string, formData: FormData) => requestForm(`/api/doctors/${id}`, "PUT", formData);

// DELETE — works reliably on both web and mobile
export const deleteDoctor = async (id: string): Promise<void> => {
  const res = await fetch(toApiUrl(`/api/doctors/${id}`), { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || `HTTP ${res.status}`);
  }
};

// Cache-busted photo URL so image always loads fresh
export const getPhotoUrl = (filename?: string | null): string | null => {
  if (!filename) return null;
  return `${API_BASE_URL}/uploads/${filename}?t=${Date.now()}`;
};

// ── Auto status helper ─────────────────────────────────────
// Returns "active" if current time falls within ANY of the doctor's availability slots today.
// Otherwise returns "inactive".
export function computeLiveStatus(availability: { day: string; startTime: string; endTime: string }[]): "active" | "inactive" {
  if (!availability || availability.length === 0) return "inactive";

  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayName = days[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of availability) {
    if (slot.day !== todayName) continue;

    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM]     = slot.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes   = endH   * 60 + (endM   || 0);

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return "active";
    }
  }
  return "inactive";
}
