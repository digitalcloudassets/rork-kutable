import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Activity, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { DATA_MODE } from '@/config/dataMode';
import { Tokens } from '@/theme/tokens';
import { ScrollScreen } from '@/components/Screen';

type ServerEnv = {
  appBaseUrl: boolean;
  supabaseUrl: boolean;
  serviceRole: boolean;
  stripeSecret: boolean;
  webhookSecret: boolean;
  platformFeeBps: boolean;
  platformFeeFlatCents: boolean;
  error?: string;
};

export default function Diagnostics() {
  const [server, setServer] = useState<ServerEnv | null>(null);
  const [loading, setLoading] = useState(false);
  const base = process.env.EXPO_PUBLIC_API_URL;

  const fetchEnv = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/health/env`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServer(data);
    } catch (e: any) {
      setServer({ 
        error: e?.message || 'Failed to fetch',
        appBaseUrl: false,
        supabaseUrl: false,
        serviceRole: false,
        stripeSecret: false,
        webhookSecret: false,
        platformFeeBps: false,
        platformFeeFlatCents: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvCallback = useCallback(fetchEnv, [base]);

  useEffect(() => {
    fetchEnvCallback();
  }, [fetchEnvCallback]);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle size={16} color="#10B981" />
    ) : (
      <XCircle size={16} color="#EF4444" />
    );
  };

  const envItems = [
    { key: 'appBaseUrl', label: 'APP_BASE_URL' },
    { key: 'supabaseUrl', label: 'SUPABASE_URL' },
    { key: 'serviceRole', label: 'SUPABASE_SERVICE_ROLE' },
    { key: 'stripeSecret', label: 'STRIPE_SECRET_KEY' },
    { key: 'webhookSecret', label: 'STRIPE_WEBHOOK_SECRET' },
    { key: 'platformFeeBps', label: 'PLATFORM_FEE_BPS' },
    { key: 'platformFeeFlatCents', label: 'PLATFORM_FEE_FLAT_CENTS' },
  ];

  return (
    <ScrollScreen>
      <Stack.Screen 
        options={{
          title: 'Diagnostics',
          headerStyle: { backgroundColor: Tokens.bg },
          headerTintColor: Tokens.text,
        }} 
      />
      
      <View style={styles.container}>
        {/* Client Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Configuration</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Data Mode</Text>
              <View style={styles.valueContainer}>
                <View style={[styles.badge, DATA_MODE === 'live' ? styles.liveBadge : styles.mockBadge]}>
                  <Text style={[styles.badgeText, DATA_MODE === 'live' ? styles.liveBadgeText : styles.mockBadgeText]}>
                    {DATA_MODE.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>API Base URL</Text>
              <Text style={styles.value}>{base || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Server Environment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Server Environment</Text>
            <Pressable 
              onPress={fetchEnv} 
              disabled={loading}
              style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
            >
              <RefreshCw 
                size={16} 
                color={loading ? Tokens.textMuted : Tokens.accent} 
                style={loading ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
              <Text style={[styles.refreshText, loading && styles.refreshTextDisabled]}>
                {loading ? 'Checking...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.card}>
            {server?.error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.errorText}>{server.error}</Text>
              </View>
            ) : (
              envItems.map((item) => (
                <View key={item.key} style={styles.row}>
                  <Text style={styles.label}>{item.label}</Text>
                  <View style={styles.statusContainer}>
                    <StatusIcon status={server?.[item.key as keyof ServerEnv] as boolean || false} />
                    <Text style={styles.statusText}>
                      {server?.[item.key as keyof ServerEnv] ? 'Set' : 'Missing'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Health Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Health Check</Text>
          <Pressable 
            style={styles.healthButton}
            onPress={() => {
              fetch(`${base}/api/health/ping`)
                .then(res => res.json())
                .then(data => alert(`Server OK: ${data.time}`))
                .catch(e => alert(`Server Error: ${e.message}`));
            }}
          >
            <Activity size={20} color="#fff" />
            <Text style={styles.healthButtonText}>Ping Server</Text>
          </Pressable>
        </View>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Tokens.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  label: {
    fontSize: 14,
    color: Tokens.text,
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: Tokens.textMuted,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadge: {
    backgroundColor: '#10B981',
  },
  mockBadge: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveBadgeText: {
    color: '#fff',
  },
  mockBadgeText: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Tokens.accent,
  },
  refreshButtonDisabled: {
    borderColor: Tokens.border,
  },
  refreshText: {
    fontSize: 14,
    color: Tokens.accent,
    fontWeight: '600',
  },
  refreshTextDisabled: {
    color: Tokens.textMuted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Tokens.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  healthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});