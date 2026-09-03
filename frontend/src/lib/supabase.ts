import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://fistswxyjudgwhislnko.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc3Rzd3h5anVkZ3doaXNsbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjU1ODQsImV4cCI6MjEwMzcwMTU4NH0.g5aA7-bGA5Onlpwf4n5CTdZ16b121OC7Q0zKhlZD23E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
