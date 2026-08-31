// src/pages/DeckPage.tsx
import { useState, useMemo } from "react";
import { AppHeader } from "../components/AppHeader";
import { FilterBar } from "../components/FilterBar";
import { Deck } from "../components/Deck";
import { LandingPage } from "../components/LandingPage";
import { Onboarding } from "../components/Onboarding";
import { Login } from "../components/Login";

import { EVENTS, filterDeck } from "../../lib/data";
import { useEventDek } from "../../lib/store";

export function DeckPage() {
  const { profile, hydrated, stateId, categories, passed, rsvps, dbEvents } =
    useEventDek();
  const [authView, setAuthView] = useState<"landing" | "onboarding" | "login">("landing");

  const pool = useMemo(() => {
    return dbEvents.length > 0 ? dbEvents : EVENTS;
  }, [dbEvents]);

  // Calculates remaining swipeable cards for the current state/category filters
  const remaining = useMemo(
    () =>
      filterDeck(pool, {
        stateId,
        categories,
        seen: [...passed, ...rsvps.map((r) => r.eventId)],
      }).length,
    [pool, stateId, categories, passed, rsvps],
  );

  // Wait for local storage to load before rendering view states
  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
      </div>
    );
  }

  // 1. If not logged in and on landing page view
  if (!profile && authView === "landing") {
    return (
      <LandingPage
        onStartOnboarding={() => setAuthView("onboarding")}
        onStartLogin={() => setAuthView("login")}
      />
    );
  }

  // 2. If not logged in and on onboarding (sign up) view
  if (!profile && authView === "onboarding") {
    return (
      <main className="min-h-dvh bg-background">
        <h1 className="sr-only">EventDek — Set up your profile</h1>
        <Onboarding onSwitchToLogin={() => setAuthView("login")} />
      </main>
    );
  }

  // 3. If not logged in and on login view
  if (!profile && authView === "login") {
    return (
      <main className="min-h-dvh bg-background">
        <h1 className="sr-only">EventDek — Sign In</h1>
        <Login onSwitchToRegister={() => setAuthView("onboarding")} />
      </main>
    );
  }

  // 4. User is logged in — show the Discovery Deck
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main>
        <h1 className="sr-only">
          EventDek discovery deck — Nigerian tech and social events
        </h1>
        <FilterBar remaining={remaining} />
        <Deck />
      </main>
    </div>
  );
}
