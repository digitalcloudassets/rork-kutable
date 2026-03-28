import { env, validateEnv } from '@/config/env';
import { apiClient } from '@/lib/api';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export default function Diagnostics() {
  const [ping, setPing] = useState('—');
  const [dbStatus, setDbStatus] = useState('—');
  const [envDump, setEnvDump] = useState<any>(null);
  const [stripeTest, setStripeTest] = useState('—');

  useEffect(() => { validateEnv(); }, []);

  const doPing = async () => {
    try {
      await apiClient.health.ping();
      setPing('✅ OK');
    } catch (e: any) {
      setPing(`❌ ${e?.message || 'Failed'}`);
    }
  };

  const doDbDiag = async () => {
    try {
      const data = await apiClient.health.supabase();
      if (data.canQueryBarbers) {
        setDbStatus(`✅ OK - Host: ${data.serverHost}`);
      } else {
        setDbStatus(`⚠️ Connected but can't query - Host: ${data.serverHost}`);
      }
    } catch (e: any) {
      setDbStatus(`❌ ${e?.message || 'Failed'}`);
    }
  };

  const doEnvDump = async () => {
    try {
      const data = await apiClient.health.envdump();
      setEnvDump(data);
    } catch (e: any) {
      setEnvDump({ error: e?.message || 'Failed' });
    }
  };

  const doStripeTest = async () => {
    try {
      // Test with a dummy barber ID to see if Stripe endpoints are working
      await apiClient.stripe.getAccountStatus({ barberId: 'test-id' });
      setStripeTest('✅ Endpoints reachable');
    } catch (e: any) {
      if (e?.message?.includes('barber not found')) {
        setStripeTest('✅ Endpoints working (test ID not found as expected)');
      } else {
        setStripeTest(`❌ ${e?.message || 'Failed'}`);
      }
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Backend Diagnostics</Text>
      
      <Text>DATA_MODE: {env.DATA_MODE}</Text>
      <Text>API Base URL: {env.API_URL}</Text>
      <Text>Supabase URL: {env.SUPABASE_URL || '— not set —'}</Text>
      
      <Pressable onPress={doPing} style={{ marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#FF6A00' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Ping Server</Text>
      </Pressable>
      <Text style={{ marginTop: 8 }}>Ping: {ping}</Text>
      
      <Pressable onPress={doDbDiag} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#007AFF' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Test Database</Text>
      </Pressable>
      <Text style={{ marginTop: 8, fontSize: 12 }}>DB Status: {dbStatus}</Text>
      
      <Pressable onPress={doStripeTest} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#34C759' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Test Stripe Endpoints</Text>
      </Pressable>
      <Text style={{ marginTop: 8, fontSize: 12 }}>Stripe: {stripeTest}</Text>
      
      <Pressable onPress={doEnvDump} style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#8E8E93' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Backend Environment</Text>
      </Pressable>
      {envDump && (
        <View style={{ marginTop: 8, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {JSON.stringify(envDump, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

