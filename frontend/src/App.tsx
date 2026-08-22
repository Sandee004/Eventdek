// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { EventDekProvider } from "../lib/store";

import { DeckPage } from "../src/pages/DeckPage";
import { MyDekPage } from "../src/components/SelectedEvents";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EventDekProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DeckPage />} />
            <Route path="/my-dek" element={<MyDekPage />} />
          </Routes>
          <Toaster position="top-center" />
        </BrowserRouter>
      </EventDekProvider>
    </QueryClientProvider>
  );
}
