import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wktxbpmwbyddmwmfymlh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdHhicG13YnlkZG13bWZ5bWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDE4NTUsImV4cCI6MjA3MTIxNzg1NX0.x8WslKawCcEoh9SzW8MnjHw63CLwH1CPoYyIAD4rJiI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For development: allow sign in without email confirmation
    // In production, you should enable email confirmation
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default supabase