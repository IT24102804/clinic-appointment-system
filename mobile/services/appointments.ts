import { toApiUrl } from "@/constants/api";
import {
  Appointment,
  AppointmentPayload,
  AppointmentStatus,
  AvailableSlotsResponse,
} from "@/types/appointment";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AppointmentFilters = {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(toApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload.data;
}

export async function listAppointments(filters?: AppointmentFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.patientId) {
    searchParams.set("patientId", filters.patientId);
  }

  if (filters?.doctorId) {
    searchParams.set("doctorId", filters.doctorId);
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  }

  if (filters?.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom);
  }

  if (filters?.dateTo) {
    searchParams.set("dateTo", filters.dateTo);
  }

  const query = searchParams.toString();
  return request<Appointment[]>(`/api/appointments${query ? `?${query}` : ""}`);
}

export async function getAppointment(id: string) {
  return request<Appointment>(`/api/appointments/${id}`);
}

export async function createAppointment(payload: AppointmentPayload) {
  return request<Appointment>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAppointment(id: string, payload: Partial<AppointmentPayload>) {
  return request<Appointment>(`/api/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function cancelAppointment(id: string) {
  return request<Appointment>(`/api/appointments/${id}/cancel`, {
    method: "PATCH",
  });
}

export async function deleteAppointment(id: string) {
  return request<{ id: string }>(`/api/appointments/${id}`, {
    method: "DELETE",
  });
}

/**
 * Fetch available 30-minute time slots for a doctor on a given date.
 * GET /api/appointments/available-slots?doctorId=xxx&date=yyyy-mm-dd
 */
export async function getAvailableSlots(doctorId: string, date: string) {
  const searchParams = new URLSearchParams({ doctorId, date });
  return request<AvailableSlotsResponse>(
    `/api/appointments/available-slots?${searchParams.toString()}`
  );
}
