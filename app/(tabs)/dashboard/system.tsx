import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';

type HealthStatus = {
  supabase: { ok: boolean; message: string };
  tables: {
    barbers: boolean;
    services: boolean;
    bookings: boolean;
    availability_blocks: boolean;
    gallery: boolean;
  };
  stripe: {
    keysLoaded: boolean;
    connectedAccountFound: boolean;
    chargesEnabled: boolean | null;
    payoutsEnabled: boolean | null;
  };
  endpoints: {
    'services.list': boolean;
    'availability.list': boolean;
    'availability.openSlots': boolean;
    'bookings.create': boolean;
    'payments.createIntent': boolean;
    'gallery.list': boolean;
    'analytics.summary': boolean;
  };
  version: {
    commit: string | null;
    buildTime: string;
  };
};

type StatusItemProps = {
  label: string;
  status: boolean | null;
  message?: string;
  onFix?: () => void;
  fixLabel?: string;
};

function StatusItem({ label, status, message, onFix, fixLabel }: StatusItemProps) {
  const getIcon = () => {
    if (status === null) return <View style={styles.iconPlaceholder} />;
    return status ? (
      <CheckCircle size={20} color="#10B981" />
    ) : (
      <XCircle size={20} color="#EF4444" />
    );
  };

  return (
    <View style={styles.statusItem}>
      <View style={styles.statusRow}>
        {getIcon()}
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>{label}</Text>
          {message && <Text style={styles.statusMessage}>{message}</Text>}
        </View>
        {onFix && !status && (
          <TouchableOpacity style={styles.fixButton} onPress={onFix}>
            <ExternalLink size={16} color="#3B82F6" />
            <Text style={styles.fixButtonText}>{fixLabel || 'Fix'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SystemStatusScreen() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/health/full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('Error fetching health status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const handleRefresh = () => {
    fetchHealthStatus();
  };

  const navigateToFix = (route: string) => {
    try {
      router.push(route as any);
    } catch (err) {
      Alert.alert('Navigation Error', 'Could not navigate to the requested screen.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Checking system status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <XCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Health Check Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!healthStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Data Available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>System Status</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <RefreshCw size={20} color="#3B82F6" />
            <Text style={styles.refreshButtonText}>Re-run checks</Text>
          </TouchableOpacity>
        </View>

        <Section title="Database">
          <StatusItem
            label="Supabase Connection"
            status={healthStatus.supabase.ok}
            message={!healthStatus.supabase.ok ? healthStatus.supabase.message : undefined}
          />
          <StatusItem
            label="Barbers Table"
            status={healthStatus.tables.barbers}
          />
          <StatusItem
            label="Services Table"
            status={healthStatus.tables.services}
          />
          <StatusItem
            label="Bookings Table"
            status={healthStatus.tables.bookings}
          />
          <StatusItem
            label="Availability Blocks Table"
            status={healthStatus.tables.availability_blocks}
          />
          <StatusItem
            label="Gallery Table"
            status={healthStatus.tables.gallery}
          />
        </Section>

        <Section title="Stripe Integration">
          <StatusItem
            label="API Keys Loaded"
            status={healthStatus.stripe.keysLoaded}
          />
          <StatusItem
            label="Connected Account Found"
            status={healthStatus.stripe.connectedAccountFound}
            onFix={() => navigateToFix('/(tabs)/dashboard/onboarding')}
            fixLabel="Connect"
          />
          <StatusItem
            label="Charges Enabled"
            status={healthStatus.stripe.chargesEnabled}
          />
          <StatusItem
            label="Payouts Enabled"
            status={healthStatus.stripe.payoutsEnabled}
          />
        </Section>

        <Section title="API Endpoints">
          <StatusItem
            label="Services List"
            status={healthStatus.endpoints['services.list']}
            onFix={() => navigateToFix('/(tabs)/dashboard/services')}
            fixLabel="Manage"
          />
          <StatusItem
            label="Availability List"
            status={healthStatus.endpoints['availability.list']}
            onFix={() => navigateToFix('/(tabs)/dashboard/calendar')}
            fixLabel="Setup"
          />
          <StatusItem
            label="Open Slots"
            status={healthStatus.endpoints['availability.openSlots']}
            onFix={() => navigateToFix('/(tabs)/dashboard/calendar')}
            fixLabel="Setup"
          />
          <StatusItem
            label="Bookings Create"
            status={healthStatus.endpoints['bookings.create']}
            onFix={() => navigateToFix('/(tabs)/')}
            fixLabel="Test"
          />
          <StatusItem
            label="Payment Intent"
            status={healthStatus.endpoints['payments.createIntent']}
          />
          <StatusItem
            label="Gallery List"
            status={healthStatus.endpoints['gallery.list']}
            onFix={() => navigateToFix('/(tabs)/dashboard/gallery')}
            fixLabel="Manage"
          />
          <StatusItem
            label="Analytics Summary"
            status={healthStatus.endpoints['analytics.summary']}
            onFix={() => navigateToFix('/(tabs)/dashboard/analytics')}
            fixLabel="View"
          />
        </Section>

        <Section title="Quick Actions">
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToFix('/(tabs)/')}
            >
              <Text style={styles.actionButtonText}>Test Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToFix('/(tabs)/profile')}
            >
              <Text style={styles.actionButtonText}>Test Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToFix('/(tabs)/dashboard/earnings')}
            >
              <Text style={styles.actionButtonText}>View Earnings</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {healthStatus.version && (
          <Section title="Version Info">
            <StatusItem
              label="Build Time"
              status={true}
              message={healthStatus.version.buildTime}
            />
            {healthStatus.version.commit && (
              <StatusItem
                label="Commit"
                status={true}
                message={healthStatus.version.commit}
              />
            )}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  fixButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});