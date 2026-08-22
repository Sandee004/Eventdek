import type { CategoryId, EventItem } from "./types";
import techSummit from "../src/assets/event-tech-summit.jpg";
import hackathon from "../src/assets/event-hackathon.jpg";
import designJam from "../src/assets/event-design-jam.jpg";
import rooftop from "../src/assets/event-rooftop-mixer.jpg";
import concert from "../src/assets/event-concert.jpg";
import virtual from "../src/assets/event-virtual.jpg";

export const NG_STATES: { id: string; name: string; short: string }[] = [
  { id: "lagos", name: "Lagos", short: "LOS" },
  { id: "abuja", name: "Abuja FCT", short: "ABV" },
  { id: "rivers", name: "Rivers", short: "PHC" },
  { id: "oyo", name: "Oyo", short: "IBD" },
  { id: "kano", name: "Kano", short: "KAN" },
  { id: "enugu", name: "Enugu", short: "ENU" },
  { id: "virtual", name: "Virtual / Nationwide", short: "NG" },
];

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "tech", name: "Tech & Developer" },
  { id: "hackathon", name: "Hackathons" },
  { id: "product", name: "Product / Design" },
  { id: "lifestyle", name: "Lifestyle & Social" },
];

export const stateName = (id: string) =>
  NG_STATES.find((s) => s.id === id)?.name ?? "Nigeria";

export const categoryName = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.name ?? "Event";

export function filterDeck(
  events: EventItem[],
  opts: { stateId: string; categories: CategoryId[]; seen: string[] },
) {
  const seen = new Set(opts.seen);
  return events
    .filter(
      (e) =>
        !seen.has(e.id) &&
        e.stateId === opts.stateId &&
        (opts.categories.length === 0 || opts.categories.includes(e.category)),
    )
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
}

/** Dates are generated relative to today so relative labels stay meaningful. */
const inDays = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const EVENTS: EventItem[] = [
  {
    id: "devfest-lagos",
    title: "Lagos Dev Summit '26",
    tagline: "Two stages, 40 speakers, one very long queue for jollof.",
    image: techSummit,
    start: inDays(2, 9),
    endTime: "5:00 PM",
    stateId: "lagos",
    area: "Victoria Island",
    venue: "Landmark Centre, Victoria Island, Lagos",
    category: "tech",
    host: { name: "Devcircle Lagos", handle: "@devcirclelag", verified: true },
    attendees: 1840,
    capacity: 2200,
    pricing: {
      kind: "paid",
      from: 7500,
      tiers: [
        {
          id: "regular",
          name: "Regular",
          price: 7500,
          note: "Main hall + expo access",
          seatsLeft: 212,
        },
        {
          id: "vip",
          name: "VIP",
          price: 25000,
          note: "Front row, lunch, speaker lounge",
          seatsLeft: 34,
        },
        {
          id: "table",
          name: "Team Table (5)",
          price: 95000,
          note: "Reserved table for five",
        },
      ],
    },
    description:
      "The biggest gathering of engineers on the Lagos calendar. Tracks on distributed systems, AI infrastructure, and building for African payments — plus a hiring floor with 30+ teams actively interviewing on the day.",
    agenda: [
      { time: "9:00 AM", item: "Doors, coffee, badge pickup" },
      { time: "10:15 AM", item: "Keynote — Shipping at Nigerian scale" },
      { time: "1:00 PM", item: "Lunch + hiring floor" },
      { time: "3:30 PM", item: "Track sessions: AI infra / payments / mobile" },
    ],
    speakers: [
      { name: "Ifeoma Adeleke", role: "Principal Engineer, Paystack" },
      { name: "Tunde Bakare", role: "CTO, Kuda" },
    ],
    questions: [
      {
        id: "github",
        label: "GitHub profile",
        type: "url",
        placeholder: "github.com/yourhandle",
        required: true,
      },
      {
        id: "stack",
        label: "Primary stack",
        type: "text",
        placeholder: "TypeScript, Go…",
      },
    ],
  },
  {
    id: "naija-hacks",
    title: "NaijaHacks Overnight",
    tagline: "36 hours. Build something that makes money by Sunday.",
    image: hackathon,
    start: inDays(5, 18),
    endTime: "Sunday 6:00 AM",
    stateId: "lagos",
    area: "Yaba",
    venue: "Zone Tech Park, Gbagada, Lagos",
    category: "hackathon",
    host: { name: "NaijaHacks", handle: "@naijahacks", verified: true },
    attendees: 620,
    capacity: 700,
    pricing: { kind: "hackathon", prizePool: 7500000 },
    description:
      "Solo or teams of four. Three tracks: fintech rails, agriculture logistics, and creator tools. Judges from Flutterwave, Microtraction and Ventures Platform. Food, power and bandwidth all covered.",
    agenda: [
      { time: "6:00 PM", item: "Team forming + track briefs" },
      { time: "9:00 PM", item: "Hacking begins, mentors on floor" },
      { time: "6:00 AM", item: "Submissions freeze" },
      { time: "10:00 AM", item: "Demos + prize ceremony" },
    ],
    questions: [
      {
        id: "github",
        label: "GitHub profile",
        type: "url",
        placeholder: "github.com/yourhandle",
        required: true,
      },
      {
        id: "team",
        label: "Team status",
        type: "select",
        options: ["I have a team", "Looking for a team"],
        required: true,
      },
      {
        id: "diet",
        label: "Dietary preference",
        type: "select",
        options: ["No preference", "Vegetarian", "Halal"],
      },
    ],
  },
  {
    id: "design-jam-abuja",
    title: "Abuja Product Jam",
    tagline: "Critique night. Bring one screen you are not proud of.",
    image: designJam,
    start: inDays(4, 16),
    endTime: "8:00 PM",
    stateId: "abuja",
    area: "Wuse 2",
    venue: "Ventures Park, Wuse 2, Abuja",
    category: "product",
    host: { name: "Abuja Design Guild", handle: "@abjdesign" },
    attendees: 96,
    capacity: 120,
    pricing: { kind: "free" },
    description:
      "A working session, not a talk. Designers and PMs pair up for structured critique rounds, then we vote on the sharpest fix of the night.",
    agenda: [
      { time: "4:00 PM", item: "Pairing + warm-up" },
      { time: "5:00 PM", item: "Critique rounds" },
      { time: "7:15 PM", item: "Open floor + drinks" },
    ],
    questions: [
      {
        id: "portfolio",
        label: "Portfolio link",
        type: "url",
        placeholder: "yourname.design",
        required: true,
      },
    ],
  },
  {
    id: "vi-rooftop",
    title: "Sundown on the Island",
    tagline: "Rooftop mixer for operators, founders and the merely curious.",
    image: rooftop,
    start: inDays(1, 17),
    endTime: "11:00 PM",
    stateId: "lagos",
    area: "Ikoyi",
    venue: "The Nest Rooftop, Ikoyi, Lagos",
    category: "lifestyle",
    host: { name: "Sundown Club", handle: "@sundownlag" },
    attendees: 210,
    capacity: 250,
    pricing: {
      kind: "paid",
      from: 15000,
      tiers: [
        {
          id: "regular",
          name: "Single Entry",
          price: 15000,
          note: "Entry + welcome cocktail",
          seatsLeft: 40,
        },
        {
          id: "vip",
          name: "VIP Lounge",
          price: 45000,
          note: "Reserved seating + bottle service",
        },
        {
          id: "table",
          name: "Table of 6",
          price: 220000,
          note: "Prime rail-side table",
        },
      ],
    },
    description:
      "Sunset set from 5pm, live sax at 8, and a strictly no-pitch-deck door policy. Smart casual.",
    agenda: [
      { time: "5:00 PM", item: "Doors + sunset set" },
      { time: "8:00 PM", item: "Live sax session" },
      { time: "9:30 PM", item: "Afrobeats till late" },
    ],
  },
  {
    id: "ph-tech-meetup",
    title: "Port Harcourt Builders Meetup",
    tagline: "Energy sector meets software. Small room, sharp people.",
    image: virtual,
    start: inDays(9, 15),
    endTime: "6:30 PM",
    stateId: "rivers",
    area: "GRA Phase 2",
    venue: "Genesis Hub, GRA Phase 2, Port Harcourt",
    category: "tech",
    host: { name: "PH Builders", handle: "@phbuilders" },
    attendees: 74,
    capacity: 90,
    pricing: { kind: "free" },
    description:
      "Lightning talks from teams building for oil & gas logistics, plus an open Q&A on remote hiring from the South-South.",
    agenda: [
      { time: "3:00 PM", item: "Arrival + intros" },
      { time: "3:45 PM", item: "Three lightning talks" },
      { time: "5:30 PM", item: "Open floor" },
    ],
  },
  {
    id: "ibadan-afro-night",
    title: "Ibadan Afro Live",
    tagline: "Full band, no laptops, one very loud brass section.",
    image: concert,
    start: inDays(12, 19),
    endTime: "1:00 AM",
    stateId: "oyo",
    area: "Bodija",
    venue: "Jogor Centre, Ibadan, Oyo",
    category: "lifestyle",
    host: { name: "Afro Live NG", handle: "@afrolivengr", verified: true },
    attendees: 1320,
    capacity: 1800,
    pricing: {
      kind: "paid",
      from: 5000,
      tiers: [
        {
          id: "regular",
          name: "Regular",
          price: 5000,
          note: "Standing, general area",
        },
        { id: "vip", name: "VIP", price: 20000, note: "Seated, front section" },
        {
          id: "table",
          name: "Table of 4",
          price: 150000,
          note: "Table + bottle",
        },
      ],
    },
    description:
      "Three acts, one house band, doors at 7pm sharp. Parking on site.",
    agenda: [
      { time: "7:00 PM", item: "Doors" },
      { time: "8:30 PM", item: "Opening act" },
      { time: "10:00 PM", item: "Headline set" },
    ],
  },
  {
    id: "remote-ng-clinic",
    title: "Remote Hiring Clinic (Virtual)",
    tagline: "Get your CV torn apart by people who actually hire.",
    image: virtual,
    start: inDays(3, 12),
    endTime: "2:00 PM",
    stateId: "virtual",
    area: "Online",
    venue: "Google Meet — link sent after RSVP",
    category: "tech",
    host: { name: "RemoteNG", handle: "@remoteng" },
    attendees: 480,
    capacity: 1000,
    pricing: { kind: "free" },
    description:
      "Live CV reviews, salary benchmarking for USD contracts, and a walkthrough of what fails Nigerian candidates at the take-home stage.",
    agenda: [
      { time: "12:00 PM", item: "Benchmarks + market read" },
      { time: "12:40 PM", item: "Live CV teardowns" },
      { time: "1:30 PM", item: "Q&A" },
    ],
    questions: [
      {
        id: "linkedin",
        label: "LinkedIn URL",
        type: "url",
        placeholder: "linkedin.com/in/you",
        required: true,
      },
    ],
  },
  {
    id: "kano-ai-clinic",
    title: "Kano AI Study Group",
    tagline: "Weekly paper club. This week: small models on cheap GPUs.",
    image: designJam,
    start: inDays(6, 10),
    endTime: "1:00 PM",
    stateId: "kano",
    area: "Nassarawa",
    venue: "Startup Kano Hub, Nassarawa, Kano",
    category: "tech",
    host: { name: "Startup Kano", handle: "@startupkano" },
    attendees: 38,
    capacity: 60,
    pricing: { kind: "free" },
    description:
      "Bring a laptop. We read one paper, then reproduce the smallest useful part of it together.",
    agenda: [
      { time: "10:00 AM", item: "Paper walkthrough" },
      { time: "11:30 AM", item: "Hands-on reproduction" },
    ],
  },
  {
    id: "enugu-hack",
    title: "Coal City Hack",
    tagline: "48 hours building for South-East small business.",
    image: hackathon,
    start: inDays(16, 17),
    endTime: "Sunday 8:00 PM",
    stateId: "enugu",
    area: "Independence Layout",
    venue: "Roar Nigeria Hub, UNN, Enugu",
    category: "hackathon",
    host: { name: "Roar Nigeria", handle: "@roarnigeria" },
    attendees: 180,
    capacity: 240,
    pricing: { kind: "hackathon", prizePool: 3000000 },
    description:
      "Track prizes for retail POS tooling, transport, and agro-processing. Mentors from Enugu and Lagos.",
    agenda: [
      { time: "5:00 PM", item: "Kickoff" },
      { time: "8:00 PM", item: "Hacking + mentor rounds" },
      { time: "4:00 PM", item: "Judging" },
    ],
    questions: [
      {
        id: "github",
        label: "GitHub profile",
        type: "url",
        placeholder: "github.com/yourhandle",
        required: true,
      },
    ],
  },
];
