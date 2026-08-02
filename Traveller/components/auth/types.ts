import type { ApiUser } from "../../shared/types/api";

/**
 * Utente come deve circolare lato client dopo il login/la registrazione:
 * identico ad ApiUser ma SENZA il campo "password" (che il server include
 * nelle risposte, ma che non deve mai essere tenuto in memoria, salvato su
 * disco o loggato sul dispositivo).
 */
export type AuthUser = Omit<ApiUser, "password">;

export type AuthMode = "login" | "register";

export interface LoginPayload {
  /** Email o username: il campo del mockup è unico, il server verifica per username. */
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface AuthFieldErrors {
  identifier?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
}
