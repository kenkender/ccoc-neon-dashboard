import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pcifvntiacjfritdnnal.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWZ2bnRpYWNqZnJpdGRubmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ0MjUsImV4cCI6MjA5MjM4MDQyNX0.m-o_DOkZ5Q-fzkiwSs0k4t8xNc0BXaM7RN3Uz4OyqzY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
