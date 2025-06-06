import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

export const supabase = createClient(
  "https://zrjlrprxfkhbgjruvyxq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyamxycHJ4ZmtoYmdqcnV2eXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTgwNTUsImV4cCI6MjA2NDM3NDA1NX0.Pf9wwEyGzMgTjfW2K8DTQaWK_9ZTmkdR04H93c8ucRI",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
