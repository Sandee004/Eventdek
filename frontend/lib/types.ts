export type CategoryId = "tech" | "hackathon" | "product" | "lifestyle";

export type ExtraQuestion = {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "url" | "select";
  options?: string[];
  required?: boolean;
};

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  note: string;
  seatsLeft?: number;
};

export type EventItem = {
  id: string;
  title: string;
  tagline: string;
  image: string;
  start: string;
  endTime: string;
  stateId: string;
  area: string;
  venue: string;
  category: CategoryId;
  host: { name: string; handle: string; verified?: boolean };
  attendees: number;
  capacity: number;
  pricing:
    | { kind: "free" }
    | { kind: "paid"; from: number; tiers: TicketTier[] }
    | { kind: "hackathon"; prizePool: number };
  description: string;
  agenda: { time: string; item: string }[];
  speakers?: { name: string; role: string }[];
  questions?: ExtraQuestion[];
};

export interface BackendEvent {
  id: string;
  title: string;
  description: string;
  banner_url?: string | null;
  venue_name: string;
  address?: string | null;
  state_id: string;
  city_area?: string | null;
  start_time: string;
  end_time: string;
  category: string;
  is_free: boolean;
  price_ngn: number;
  source_platform: string;
  source_url?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  stateId: string;
  cityArea?: string;
  role?: string;
  handle?: string;
  calendarSync: boolean;
}

export type Rsvp = {
  eventId: string;
  createdAt: number;
  tierId?: string;
  amount: number;
  method?: string;
  answers?: Record<string, string>;
  reference: string;
};
