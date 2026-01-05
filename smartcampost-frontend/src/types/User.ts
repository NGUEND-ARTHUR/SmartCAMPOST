export type UserRole = "ADMIN" | "AGENT" | "COURIER" | "CLIENT";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
}
