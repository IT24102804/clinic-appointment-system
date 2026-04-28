export type UserRole = "patient" | "doctor" | "admin";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};
