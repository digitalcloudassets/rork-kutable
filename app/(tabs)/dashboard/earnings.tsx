import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';
import { apiClient } from '@/lib/api';
import { getUserId } from '@/lib/session';
import { validateEnv } from '@/config/env';
import { EmptyCard } from '@/components/EmptyState';

interface EarningsSummary {
  gross: number;
  fees: number;
  net: number;
  range?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled' | 'completed';
  date: string;
  arrivalDate?: string;
}

type TimeRange = 'today' | 'week' | 'month';

const formatCurrency = (cents: number): string => {
  return `${(cents / 100).toFixed(2)}`;
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: Payout['status']): string => {
  switch (status) {
    case 'paid':
    case 'completed':
      return Tokens.success;
    case 'in_transit':
      return Tokens.warning;
    case 'pending':
      return Tokens.textMuted;
    case 'failed':
      return Tokens.error;
    case 'canceled':
      return Tokens.textMuted;
    default:
      return Tokens.textMuted;
  }
};

const getStatusIcon = (status: Payout['status']) => {
  const color = getStatusColor(status);
  const size = 16;
  
  switch (status) {
    case 'paid':
    case 'completed':
      return <CheckCircle size={size} color={color} />;
    case 'in_transit':
      return <Clock size={size} color={color} />;
    case 'pending':
      return <Clock size={size} color={color} />;
    case 'failed':
    case 'canceled':
      return <AlertCircle size={size} color={color} />;
    default:
      return <Clock size={size} color={color} />;
  }
};

export default function EarningsScreen() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('month');
  const [earnings, setEarnings] = useState<EarningsSummary>({
    gross: 0,
    fees: 0,
    net: 0,
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async (range: TimeRange) => {
    try {
      setError(null);
      const uid = await getUserId();
      if (!uid) {
        console.warn('User not signed in, using empty earnings');
        setEarnings({ gross: 0, fees: 0, net: 0 });
        return;
      }
      
      console.log(`Fetching earnings for range: ${range}`);
      validateEnv(); // Check environment variables
      const data = await apiClient.earnings.summary({ barberId: uid, range });
      console.log('Earnings data received:', data);
      setEarnings(data);
    } catch (error: any) {
      console.error('Error fetching earnings summary:', error);
      setError(`Failed to load earnings: ${error.message}`);
      setEarnings({ gross: 0, fees: 0, net: 0 });
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      setError(null);
      const uid = await getUserId();
      if (!uid) {
        console.warn('User not signed in, using empty payouts');
        setPayouts([]);
        return;
      }
      
      console.log('Fetching payouts list');
      validateEnv(); // Check environment variables
      const data = await apiClient.payouts.list({ barberId: uid });
      console.log('Payouts data received:', data?.length || 0, 'payouts');
      setPayouts(data || []);
    } catch (error: any) {
      console.error('Error fetching payouts list:', error);
      setError(`Failed to load payouts: ${error.message}`);
      setPayouts([]);
    }
  }, []);

  const loadData = useCallback(async (range: TimeRange = selectedRange) => {
    setLoading(true);
    await Promise.all([
      fetchEarnings(range),
      fetchPayouts(),
    ]);
    setLoading(false);
  }, [selectedRange, fetchEarnings, fetchPayouts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    fetchEarnings(range);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Tokens.accent} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.rangeSelector}>
          {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.rangeButtonActive,
              ]}
              onPress={() => handleRangeChange(range)}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  selectedRange === range && styles.rangeButtonTextActive,
                ]}
              >
                {getRangeLabel(range)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <DollarSign size={24} color={Tokens.success} />
              <Text style={styles.summaryTitle}>Gross Revenue</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ${formatCurrency(earnings.gross)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <TrendingUp size={24} color={Tokens.warning} />
              <Text style={styles.summaryTitle}>Platform Fees</Text>
            </View>
            <Text style={styles.summaryAmount}>
              -${formatCurrency(earnings.fees)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.netEarningsCard]}>
            <View style={styles.summaryHeader}>
              <CheckCircle size={24} color="#FFFFFF" />
              <Text style={[styles.summaryTitle, styles.netEarningsTitle]}>
                Net Earnings
              </Text>
            </View>
            <Text style={[styles.summaryAmount, styles.netEarningsAmount]}>
              ${formatCurrency(earnings.net)}
            </Text>
          </View>
        </View>

        {/* Payouts Section */}
        <View style={styles.payoutsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ExternalLink size={16} color={Tokens.accent} />
            </TouchableOpacity>
          </View>
          
          {payouts.length === 0 ? (
            <EmptyCard
              icon={DollarSign}
              title="No payouts yet"
              subtitle={
                earnings.net > 0 
                  ? 'Complete more bookings to trigger your first payout'
                  : 'Complete bookings and connect Stripe to start earning payouts'
              }
              actionLabel={earnings.net === 0 ? "Setup Stripe" : undefined}
              onAction={earnings.net === 0 ? () => console.log('Navigate to Stripe setup') : undefined}
              testID="earnings-no-payouts"
            />
          ) : (
            <View style={styles.payoutsList}>
              {payouts.map((payout) => (
                <View key={payout.id} style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <View style={styles.payoutStatus}>
                      {getStatusIcon(payout.status)}
                      <Text style={styles.payoutStatusText}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.payoutAmount}>
                      ${formatCurrency(payout.amount)}
                    </Text>
                  </View>
                  
                  <View style={styles.payoutDetails}>
                    <Text style={styles.payoutDate}>
                      Created: {formatDate(payout.date)}
                    </Text>
                    {payout.status === 'in_transit' && payout.arrivalDate && (
                      <Text style={styles.payoutArrival}>
                        Arriving: {formatDate(payout.arrivalDate)}
                      </Text>
                    )}
                    {payout.status === 'pending' && payout.arrivalDate && (
                      <Text style={styles.payoutArrival}>
                        Expected: {formatDate(payout.arrivalDate)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  rangeSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: Tokens.accent,
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.textMuted,
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  netEarningsCard: {
    backgroundColor: Tokens.accent,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginLeft: 8,
  },
  netEarningsTitle: {
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Tokens.text,
  },
  netEarningsAmount: {
    color: '#FFFFFF',
  },
  payoutsSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Tokens.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.accent,
  },

  payoutsList: {
    gap: 12,
  },
  payoutCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.text,
    marginLeft: 6,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Tokens.text,
  },
  payoutDetails: {
    gap: 4,
  },
  payoutDate: {
    fontSize: 12,
    color: Tokens.textMuted,
  },
  payoutArrival: {
    fontSize: 12,
    color: Tokens.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Tokens.textMuted,
  },
  errorContainer: {
    backgroundColor: Tokens.error + '20',
    borderColor: Tokens.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: Tokens.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Tokens.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});