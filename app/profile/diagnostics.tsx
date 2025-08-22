import { env, validateEnv } from '@/config/env';
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function Diagnostics() {
  const [ping, setPing] = useState('—');
  const [dbStatus, setDbStatus] = useState('—');

  useEffect(() => { validateEnv(); }, []);

  const doPing = async () => {
    try {
      const r = await fetch(`${env.API_URL}/api/health/ping`);
      setPing(r.ok ? 'OK' : `HTTP ${r.status}`);
    } catch {
      setPing('Network request failed');
    }
  };

  const doDbDiag = async () => {
    try {
      const r = await fetch(`${env.API_URL}/api/diag/db`);
      if (r.ok) {
        const data = await r.json();
        if (data.ok) {
          const counts = Object.entries(data.counts)
            .map(([table, count]) => `${table}: ${count ?? 'null'}`)
            .join(', ');
          setDbStatus(`OK - ${counts}`);
        } else {
          setDbStatus(`Error: ${data.error}`);
        }
      } else {
        setDbStatus(`HTTP ${r.status}`);
      }
    } catch (e: any) {
      setDbStatus(`Failed: ${e?.message || 'Network error'}`);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>DATA_MODE: {env.DATA_MODE}</Text>
      <Text>API Base URL: {env.API_URL}</Text>
      <Text>Supabase URL: {env.SUPABASE_URL || '— not set —'}</Text>
      <Pressable onPress={doPing} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#FF6A00' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Ping Server</Text>
      </Pressable>
      <Text style={{ marginTop: 8 }}>Ping: {ping}</Text>
      
      <Pressable onPress={doDbDiag} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#007AFF' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Test Database</Text>
      </Pressable>
      <Text style={{ marginTop: 8, fontSize: 12 }}>DB Status: {dbStatus}</Text>
    </View>
  );
}

