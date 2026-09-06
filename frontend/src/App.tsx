import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Compass, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "./components/ui/sonner";

import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Home from "./components/Homepage";
import { MyDek } from "./components/RegisteredEvents";
import Profile from "./components/Profile";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

// Helper to check authentication state[cite: 1, 3]
function isAuthenticated(): boolean {
  const token = localStorage.getItem("eventdek_token");
  const user = localStorage.getItem("eventdek_user");
  return Boolean(token && user);
}

// Redirects unauthenticated visitors to /login[cite: 1, 3]
function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Redirects logged-in users away from guest pages
function PublicOnlyRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/homepage" replace />;
  }

  return <Outlet />;
}

// 404 Not Found Page Component
function NotFound() {
  const isAuth = isAuthenticated();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12">
      {/* Blueprint Grid Ambient Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklab, var(--color-foreground) 10%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--color-foreground) 10%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Atmospheric Blur Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-going/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-pass/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-frame relative w-full max-w-md rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-sm"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-border bg-surface-2 text-going shadow-inner">
          <Compass className="size-8" />
        </div>

        <span className="mt-5 inline-block font-mono text-xs font-bold uppercase tracking-widest text-going">
          Error 404
        </span>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Off the Map
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          The page or deck you are looking for has expired, moved, or never
          existed in this region.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link
            to={isAuth ? "/homepage" : "/"}
            className="tactile flex flex-1 items-center justify-center gap-2 rounded-xl bg-going py-3 text-xs font-bold text-going-foreground shadow-md transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            {isAuth ? "Return to Events" : "Back to Home"}
          </Link>

          {isAuth && (
            <Link
              to="/registered-events"
              className="tactile flex items-center justify-center rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
            >
              My Passes
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest / Public-Only Pages */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Authenticated / Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/homepage" element={<Home />} />
            <Route path="/registered-events" element={<MyDek />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <InstallPrompt />
        <Toaster position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
