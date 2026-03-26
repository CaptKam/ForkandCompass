/**
 * Supabase Database Schema for Fork & Compass
 *
 * Run the following SQL in your Supabase SQL Editor
 * (Dashboard → SQL Editor → New Query):
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * -- User profiles table
 * CREATE TABLE IF NOT EXISTS public.profiles (
 *   id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *   email TEXT,
 *   cooking_level TEXT DEFAULT 'home-cook',
 *   appearance_mode TEXT DEFAULT 'system',
 *   selected_country_ids TEXT[] DEFAULT '{}',
 *   saved_recipe_ids TEXT[] DEFAULT '{}',
 *   saved_country_ids TEXT[] DEFAULT '{}',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Enable Row Level Security
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 *
 * -- Users can only read/write their own profile
 * CREATE POLICY "Users can view own profile"
 *   ON public.profiles FOR SELECT
 *   USING (auth.uid() = id);
 *
 * CREATE POLICY "Users can update own profile"
 *   ON public.profiles FOR UPDATE
 *   USING (auth.uid() = id);
 *
 * CREATE POLICY "Users can insert own profile"
 *   ON public.profiles FOR INSERT
 *   WITH CHECK (auth.uid() = id);
 *
 * -- Auto-create profile on signup
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   INSERT INTO public.profiles (id, email)
 *   VALUES (NEW.id, NEW.email);
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * CREATE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          cooking_level: string;
          appearance_mode: string;
          selected_country_ids: string[];
          saved_recipe_ids: string[];
          saved_country_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          cooking_level?: string;
          appearance_mode?: string;
          selected_country_ids?: string[];
          saved_recipe_ids?: string[];
          saved_country_ids?: string[];
        };
        Update: {
          cooking_level?: string;
          appearance_mode?: string;
          selected_country_ids?: string[];
          saved_recipe_ids?: string[];
          saved_country_ids?: string[];
          updated_at?: string;
        };
      };
    };
  };
}
