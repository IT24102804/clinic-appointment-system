import { toApiUrl } from "@/constants/api";
import { ApiEnvelope } from "@/types/api";
import { AuthPayload } from "@/types/auth";

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> & { errors?: string[] };

  if (!response.ok || !payload.success) {
    const details = Array.isArray(payload.errors) && payload.errors.length > 0 ? payload.errors.join("\n") : null;
    const message = details ? details : payload.message || "Request failed.";
    throw new Error(message);
  }

  if (payload.data === undefined) {
    throw new Error("No data returned from the server.");
  }

  return payload.data;
}

export async function registerPatient(input: RegisterInput): Promise<AuthPayload> {
  const response = await fetch(toApiUrl("/api/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...input, role: "patient" }),
  });

  return parseEnvelope<AuthPayload>(response);
}

export async function login(input: LoginInput): Promise<AuthPayload> {
  const response = await fetch(toApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseEnvelope<AuthPayload>(response);
}
