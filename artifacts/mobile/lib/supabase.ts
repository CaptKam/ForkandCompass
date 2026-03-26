// Supabase client — safe for Expo Go (falls back gracefully if packages missing)
let supabase: any = null;

try {
  require("react-native-url-polyfill/auto");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  const { createClient } = require("@supabase/supabase-js");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    console.warn("[Supabase] Missing environment variables — running offline");
  }
} catch (e) {
  console.warn("[Supabase] Packages not available — running offline");
}

export { supabase };
