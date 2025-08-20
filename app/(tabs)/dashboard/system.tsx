import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database,
  CreditCard,
  Server,
  Settings,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { brandColors } from '@/config/brand';

interface HealthSnapshot {
  supabase: { ok: boolean; message?: string };
  counts: {
    barbers: number | null;
    services: number | null;
    bookings7d: number | null;
    blocks7d: number | null;
    gallery: number | null;
  };
  stripe: {
    keysLoaded: boolean;
    connectedAccounts: number;
    exampleConnected?: string | null;
  };
  endpoints: {
    services_list?: boolean;
    availability_openSlots?: boolean;
    bookings_create?: boolean;
  };
  timestamp: string;
}

interface StatusItemProps {
  label: string;
  status: boolean | null;
  message?: string;
  onFix?: () => void;
  fixLabel?: string;
}

function StatusItem({ label, status, message, onFix, fixLabel }: StatusItemProps) {
  const getIcon = () => {
    if (status === null) return <AlertCircle size={20} color={brandColors.warning} />;
    return status ? (
      <CheckCircle size={20} color={brandColors.success} />
    ) : (
      <XCircle size={20} color={brandColors.error} />
    );
  };

  const getStatusColor = () => {
    if (status === null) return brandColors.warning;
    return status ? brandColors.success : brandColors.error;
  };

  return (
    <View style={styles.statusItem}>
      <View style={styles.statusInfo}>
        <View style={styles.statusHeader}>
          {getIcon()}
          <Text style={styles.statusLabel}>{label}</Text>
        </View>
        {message && (
          <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
            {message}
          </Text>
        )}
      </View>
      {onFix && (
        <TouchableOpacity style={styles.fixButton} onPress={onFix}>
          <ExternalLink size={16} color={brandColors.primary} />
          <Text style={styles.fixButtonText}>{fixLabel || 'Fix'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon size={20} color={brandColors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SystemStatusScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: healthData, isLoading, refetch, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<HealthSnapshot> => {
      const response = await fetch('/backend/health/snapshot');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh system status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigation = (route: string) => {
    try {
      router.push(route as any);
    } catch (err) {
      Alert.alert('Navigation Error', 'Could not navigate to the requested screen');
    }
  };

  if (isLoading && !healthData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.primary} />
        <Text style={styles.loadingText}>Checking system status...</Text>
      </View>
    );
  }

  if (error && !healthData) {
    return (
      <View style={styles.errorContainer}>
        <XCircle size={48} color={brandColors.error} />
        <Text style={styles.errorTitle}>Health Check Failed</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw size={20} color={brandColors.primary} />
          <Text style={styles.refreshButtonText}>Re-run Checks</Text>
        </TouchableOpacity>
      </View>

      {/* Timestamp Info */}
      {healthData?.timestamp && (
        <View style={styles.versionCard}>
          <Text style={styles.versionTitle}>Last Updated</Text>
          <Text style={styles.versionText}>
            {new Date(healthData.timestamp).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Supabase Section */}
      <Section title="Database Connection" icon={Database}>
        <StatusItem
          label="Supabase Connection"
          status={healthData?.supabase.ok ?? false}
          message={healthData?.supabase.message}
        />
      </Section>

      {/* Data Counts Section */}
      <Section title="Data Counts" icon={Server}>
        <StatusItem
          label="Barbers"
          status={healthData?.counts.barbers !== null}
          message={healthData?.counts.barbers !== null ? `${healthData?.counts.barbers} records` : 'Table not found'}
        />
        <StatusItem
          label="Services"
          status={healthData?.counts.services !== null}
          message={healthData?.counts.services !== null ? `${healthData?.counts.services} records` : 'Table not found'}
          onFix={() => handleNavigation('/(tabs)/dashboard/services')}
          fixLabel="Manage Services"
        />
        <StatusItem
          label="Bookings (7d)"
          status={healthData?.counts.bookings7d !== null}
          message={healthData?.counts.bookings7d !== null ? `${healthData?.counts.bookings7d} recent` : 'Table not found'}
        />
        <StatusItem
          label="Availability Blocks (7d)"
          status={healthData?.counts.blocks7d !== null}
          message={healthData?.counts.blocks7d !== null ? `${healthData?.counts.blocks7d} recent` : 'Table not found'}
          onFix={() => handleNavigation('/(tabs)/dashboard/calendar')}
          fixLabel="Manage Calendar"
        />
        <StatusItem
          label="Gallery Items"
          status={healthData?.counts.gallery !== null}
          message={healthData?.counts.gallery !== null ? `${healthData?.counts.gallery} items` : 'Table not found'}
          onFix={() => handleNavigation('/(tabs)/dashboard/gallery')}
          fixLabel="Manage Gallery"
        />
      </Section>

      {/* Stripe Section */}
      <Section title="Payment Processing" icon={CreditCard}>
        <StatusItem
          label="Stripe Keys Loaded"
          status={healthData?.stripe.keysLoaded ?? false}
          message={healthData?.stripe.keysLoaded ? 'Keys configured' : 'Missing STRIPE_SECRET_KEY'}
        />
        <StatusItem
          label="Connected Accounts"
          status={(healthData?.stripe.connectedAccounts ?? 0) > 0}
          message={`${healthData?.stripe.connectedAccounts ?? 0} connected${healthData?.stripe.exampleConnected ? ` (e.g. ${healthData.stripe.exampleConnected.slice(0, 12)}...)` : ''}`}
          onFix={() => handleNavigation('/(tabs)/dashboard/onboarding')}
          fixLabel="Connect Stripe"
        />
      </Section>

      {/* API Endpoints Section */}
      <Section title="API Endpoints" icon={Settings}>
        <StatusItem
          label="Services List"
          status={healthData?.endpoints.services_list ?? false}
          message={healthData?.endpoints.services_list ? 'Responding' : 'Not responding'}
          onFix={() => handleNavigation('/(tabs)/dashboard/services')}
          fixLabel="Services"
        />
        <StatusItem
          label="Availability Slots"
          status={healthData?.endpoints.availability_openSlots ?? false}
          message={healthData?.endpoints.availability_openSlots ? 'Responding' : 'Not responding'}
          onFix={() => handleNavigation('/(tabs)/dashboard/calendar')}
          fixLabel="Calendar"
        />
        <StatusItem
          label="Booking Creation"
          status={healthData?.endpoints.bookings_create ?? false}
          message={healthData?.endpoints.bookings_create ? 'Responding' : 'Not responding'}
        />
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions" icon={ExternalLink}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleNavigation('/(tabs)')}
          >
            <MapPin size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleNavigation('/(tabs)/profile')}
          >
            <Users size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleNavigation('/(tabs)/dashboard/earnings')}
          >
            <DollarSign size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>Earnings</Text>
          </TouchableOpacity>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: brandColors.primaryLight,
    gap: 6,
  },
  refreshButtonText: {
    color: brandColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  versionCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionContent: {
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  statusInfo: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  statusMessage: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 28,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: brandColors.primaryLight,
    gap: 4,
  },
  fixButtonText: {
    color: brandColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: brandColors.primaryLight,
    gap: 8,
  },
  actionButtonText: {
    color: brandColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});