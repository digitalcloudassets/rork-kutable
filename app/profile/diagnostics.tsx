import { env, validateEnv } from '@/config/env';
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function Diagnostics() {
  const [ping, setPing] = useState<string>('—');
  useEffect(() => { validateEnv(); }, []);
  const doPing = async () => {
    try {
      const r = await fetch(`${env.API_URL}/api/health/ping`);
      setPing(r.ok ? 'OK' : `HTTP ${r.status}`);
    } catch { setPing('Network request failed'); }
  };
  return (
    <View style={{ padding:16 }}>
      <Text>DATA_MODE: {env.DATA_MODE}</Text>
      <Text>API Base URL: {env.API_URL || '— not set —'}</Text>
      <Text>Supabase URL: {env.SUPABASE_URL || '— not set —'}</Text>
      <Pressable onPress={doPing} style={{ marginTop:12, padding:12, borderRadius:10, backgroundColor:'#FF6A00' }}>
        <Text style={{ color:'#fff', fontWeight:'700' }}>Ping Server</Text>
      </Pressable>
      <Text style={{ marginTop:8 }}>Ping: {ping}</Text>
    </View>
  );
}

