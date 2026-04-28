import { toApiUrl } from "@/constants/api";
import { ApiEnvelope } from "@/types/api";
import { PatientProfile } from "@/types/patient";

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> & { errors?: string[] };

  if (!response.ok || !payload.success) {
    const details = Array.isArray(payload.errors) && payload.errors.length > 0 ? payload.errors.join("\n") : null;
    const message = details ? details : payload.message || "Request failed.";
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  if (payload.data === undefined) {
    throw new Error("No data returned from the server.");
  }

  return payload.data;
}

export async function getPatientProfile(token: string): Promise<PatientProfile> {
  const response = await fetch(toApiUrl("/api/patients/profile"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseEnvelope<PatientProfile>(response);
}

type CreatePatientProfileInput = {
  nic: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
};

export async function createPatientProfile(token: string, input: CreatePatientProfileInput): Promise<PatientProfile> {
  const response = await fetch(toApiUrl("/api/patients/profile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return parseEnvelope<PatientProfile>(response);
}
