import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://knmpekpurhnkvkgvtosl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubXBla3B1cmhua3ZrZ3Z0b3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjkxMjksImV4cCI6MjA5MzkwNTEyOX0.pBx_OtT7Z6mXrAg0j5M_dJ3r3d2AGMQrwBiGw_a7-58'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)