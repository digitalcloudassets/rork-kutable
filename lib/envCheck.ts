import { env } from '@/config/env';
import { Alert, Platform } from 'react-native';

interface SupabaseHealthResponse {
  serverHost?: string;
  canQueryBarbers?: boolean;
}

export async function assertSameSupabaseProject() {
  try {
    const clientUrl =
      env.EXPO_PUBLIC_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';

    const res = await fetch((env.API_URL || 'https://kutable.rork.app') + '/api/health/supabase', {
      cache: 'no-store',
    });
    const j: SupabaseHealthResponse = await res.json().catch(() => ({}));
    const serverHost = j?.serverHost || 'unknown';

    if (clientHost !== serverHost && clientHost !== 'unknown' && serverHost !== 'unknown') {
      const errorMessage = `Supabase project mismatch detected:\n\nClient: ${clientHost}\nServer: ${serverHost}`;
      const fixMessage = `\n\nTo fix this:\n1. Check your environment variables\n2. Ensure EXPO_PUBLIC_SUPABASE_URL matches server config\n3. Restart the development server after changes`;
      
      console.error('ERROR: Supabase project mismatch', { 
        clientHost, 
        serverHost,
        clientUrl,
        fix: 'Update EXPO_PUBLIC_SUPABASE_URL to match server configuration'
      });
      
      // Show actionable error in development
      if (__DEV__) {
        Alert.alert(
          'Configuration Error',
          errorMessage + fixMessage,
          [
            {
              text: 'Copy Client URL',
              onPress: () => {
                if (Platform.OS === 'web') {
                  navigator.clipboard?.writeText(clientUrl || '');
                } else {
                  console.log('Client URL to copy:', clientUrl);
                }
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      }
      
      return false;
    }
    
    console.log('✓ Supabase project configuration verified', { clientHost, serverHost });
    return true;
  } catch (e) {
    console.warn('Supabase health check failed:', e);
    return null; // Unknown state
  }
}

export function getSupabaseConfigStatus() {
  const clientUrl =
    env.EXPO_PUBLIC_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
    
  return {
    hasClientUrl: !!clientUrl,
    clientUrl,
    clientHost: clientUrl ? new URL(clientUrl).host : null
  };
}