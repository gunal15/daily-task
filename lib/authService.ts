"use client";

import { supabase } from "./supabaseClient";

export interface AppUser {
  id: string;
  username: string;
}

interface AuthResponse {
  user_id: string;
  username: string;
  session_token: string;
}

export const AUTH_USER_KEY = "daily_tasks_user";
export const AUTH_SESSION_KEY = "daily_tasks_session";

function saveSession(row: AuthResponse): AppUser {
  const user = { id: row.user_id, username: row.username };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_SESSION_KEY, row.session_token);
  return user;
}

function cleanMessage(message: string) {
  return message.replace(/^Error:\s*/i, "");
}

export function getStoredUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export async function register(username: string, pin: string): Promise<AppUser> {
  const { data, error } = await supabase
    .rpc("app_register", { p_username: username, p_pin: pin })
    .single<AuthResponse>();

  if (error) throw new Error(cleanMessage(error.message));
  return saveSession(data);
}

export async function signIn(username: string, pin: string): Promise<AppUser> {
  const { data, error } = await supabase
    .rpc("app_sign_in", { p_username: username, p_pin: pin })
    .single<AuthResponse>();

  if (error) throw new Error(cleanMessage(error.message));
  return saveSession(data);
}
