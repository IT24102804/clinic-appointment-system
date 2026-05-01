import { API_BASE_URL, toApiUrl } from "@/constants/api";

export type AvailabilitySlot = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startTime: string;
  endTime: string;
};

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  experience: number;
  fee: number;
  photo: string | null;
  status: "active" | "inactive";
  availability: AvailabilitySlot[];
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
};

// ── JSON-based requests ────────────────────────────────────

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(toApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as {
    success: boolean;
    message: string;
    data: T;
  } | null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload.data;
}

// ── FormData-based requests (for photo uploads) ────────────

async function requestForm<T>(path: string, method: string, formData: FormData) {
  const res = await fetch(toApiUrl(path), { method, body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data as T;
}

// ── CRUD operations ────────────────────────────────────────

/** GET /api/doctors */
export const listDoctors = () => request<Doctor[]>("/api/doctors");

/** GET /api/doctors/:id */
export const getDoctor = (id: string) => request<Doctor>(`/api/doctors/${id}`);

/** POST /api/doctors (FormData — supports photo upload) */
export const createDoctor = (formData: FormData) =>
  requestForm<Doctor>("/api/doctors", "POST", formData);

/** PUT /api/doctors/:id (FormData — supports photo upload) */
export const updateDoctor = (id: string, formData: FormData) =>
  requestForm<Doctor>(`/api/doctors/${id}`, "PUT", formData);

/** DELETE /api/doctors/:id */
export const deleteDoctor = async (id: string): Promise<void> => {
  const res = await fetch(toApiUrl(`/api/doctors/${id}`), { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || `HTTP ${res.status}`);
  }
};

// ── Helpers ────────────────────────────────────────────────

/** Cache-busted photo URL so image always loads fresh */
export const getPhotoUrl = (filename?: string | null): string | null => {
  if (!filename) return null;
  return `${API_BASE_URL}/uploads/${filename}?t=${Date.now()}`;
};

/**
 * Returns "active" if current time falls within ANY of the
 * doctor's availability slots today. Otherwise "inactive".
 */
export function computeLiveStatus(
  availability: { day: string; startTime: string; endTime: string }[]
): "active" | "inactive" {
  if (!availability || availability.length === 0) return "inactive";

  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayName = days[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of availability) {
    if (slot.day !== todayName) continue;

    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return "active";
    }
  }
  return "inactive";
}
