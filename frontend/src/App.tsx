import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";

import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Home from "./components/Homepage";
import { MyDek } from "./components/RegisteredEvents";
import Profile from "./components/Profile";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/homepage" element={<Home />} />
          <Route path="/registered-events" element={<MyDek />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>

        <InstallPrompt />
        <Toaster position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
