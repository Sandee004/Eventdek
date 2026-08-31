import type { BackendEvent, CategoryId, EventItem, Profile } from "./types";

// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

/** Converts backend snake_case BackendEvent to frontend camelCase EventItem */
export function adaptEvent(b: BackendEvent): EventItem {
  const validCategory: CategoryId =
    b.category &&
    ["tech", "hackathon", "product", "lifestyle"].includes(
      b.category.toLowerCase(),
    )
      ? (b.category.toLowerCase() as CategoryId)
      : "tech";

  const hostName = b.source_platform
    ? b.source_platform.charAt(0).toUpperCase() + b.source_platform.slice(1)
    : "EventDek";
  const hostHandle = `@${b.source_platform ? b.source_platform.toLowerCase() : "eventdek"}`;

  const imageFallback =
    b.banner_url && b.banner_url.startsWith("http")
      ? b.banner_url
      : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800";

  const isFree = b.is_free || !b.price_ngn || b.price_ngn === 0;

  return {
    id: b.id,
    title: b.title,
    tagline: b.description
      ? b.description.length > 95
        ? b.description.slice(0, 95) + "…"
        : b.description
      : `Live in ${b.state_id}`,
    image: imageFallback,
    start: b.start_time,
    endTime: b.end_time || "TBD",
    stateId: b.state_id ? b.state_id.toLowerCase() : "lagos",
    area:
      b.city_area ||
      (b.address && b.address !== b.venue_name
        ? b.address
        : b.venue_name || "Main City"),
    venue: b.venue_name || "Venue TBD",
    category: validCategory,
    host: {
      name: hostName,
      handle: hostHandle,
      verified: true,
    },
    attendees: 150,
    capacity: 300,
    pricing: isFree
      ? { kind: "free" }
      : validCategory === "hackathon"
        ? { kind: "hackathon", prizePool: b.price_ngn }
        : {
            kind: "paid",
            from: b.price_ngn,
            tiers: [
              {
                id: "regular",
                name: "Regular",
                price: b.price_ngn,
                note: "Standard entry ticket",
              },
            ],
          },
    description: b.description,
    agenda: [
      { time: "Doors Open", item: "Check-in & Welcome" },
      { time: "Main Event", item: b.title },
    ],
    speakers: [],
    questions: [],
  };
}

export async function fetchDeckApi(
  token: string,
  stateId?: string,
  category?: string,
  limit: number = 20,
): Promise<EventItem[]> {
  const params = new URLSearchParams();
  if (stateId) params.append("state_id", stateId);
  if (category) params.append("category", category);
  params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE_URL}/events/deck?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch deck" }));
    throw new Error(
      err.detail || "Failed to load events from backend database.",
    );
  }

  const rawEvents: BackendEvent[] = await res.json();
  return rawEvents.map(adaptEvent);
}

export async function swipeEventApi(
  token: string,
  eventId: string,
  direction: "pass" | "rsvp",
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/events/swipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      event_id: eventId,
      direction: direction,
    }),
  });

  if (!res.ok) {
    console.warn(`Failed to record swipe for event ${eventId} in database`);
  }
}
