import type { Profile } from "./types";

const API_BASE_URL = "http://localhost:8000";

// Payload sent to backend endpoints (snake_case)
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  state_id: string;
  city_area?: string;
  role?: string;
  handle?: string;
  calendar_sync: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// User object structure returned by FastAPI backend (snake_case)
export interface BackendUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  state_id: string;
  city_area?: string;
  role?: string;
  handle?: string;
  calendar_sync: boolean;
}

export interface RawAuthApiResponse {
  access_token: string;
  token_type: string;
  user: BackendUserProfile;
}

export interface AuthApiResponse {
  access_token: string;
  token_type: string;
  user: Profile;
}

/** Converts backend snake_case UserProfile to frontend camelCase Profile */
export function adaptProfile(backendUser: BackendUserProfile): Profile {
  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    phone: backendUser.phone,
    stateId: backendUser.state_id || "lagos",
    cityArea: backendUser.city_area || "",
    role: backendUser.role || "",
    handle: backendUser.handle || "",
    calendarSync: backendUser.calendar_sync,
  };
}

export async function registerApi(
  payload: RegisterPayload,
): Promise<AuthApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Registration failed" }));
    throw new Error(
      errorData.detail || "Registration failed. Please try again.",
    );
  }

  const data: RawAuthApiResponse = await res.json();
  return {
    access_token: data.access_token,
    token_type: data.token_type,
    user: adaptProfile(data.user),
  };
}

export async function loginApi(
  payload: LoginPayload,
): Promise<AuthApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Login failed" }));
    throw new Error(errorData.detail || "Invalid email or password.");
  }

  const data: RawAuthApiResponse = await res.json();
  return {
    access_token: data.access_token,
    token_type: data.token_type,
    user: adaptProfile(data.user),
  };
}

export async function logoutApi(token?: string): Promise<{ message: string }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    return { message: "Logged out" };
  }
  return res.json();
}

export async function getProfileApi(token: string): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Session expired or invalid token.");
  }

  const data: BackendUserProfile = await res.json();
  return adaptProfile(data);
}

