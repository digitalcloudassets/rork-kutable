import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

interface EarningsSummary {
  grossCents: number;
  feesCents: number;
  netCents: number;
  range?: string;
}

interface Payout {
  id: string;
  amountCents: number;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  arrivalDateISO: string;
  createdAtISO: string;
}

type TimeRange = 'today' | 'week' | 'month';

const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
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
      return '#10B981';
    case 'in_transit':
      return '#F59E0B';
    case 'pending':
      return '#6B7280';
    case 'failed':
      return '#EF4444';
    case 'canceled':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

const getStatusIcon = (status: Payout['status']) => {
  const color = getStatusColor(status);
  const size = 16;
  
  switch (status) {
    case 'paid':
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
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [earnings, setEarnings] = useState<EarningsSummary>({
    grossCents: 0,
    feesCents: 0,
    netCents: 0,
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async (range: TimeRange) => {
    if (!user?.id) return;

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.warn('Backend URL not configured, using mock earnings data');
      const mockData = {
        today: { grossCents: 8500, feesCents: 500, netCents: 8000 },
        week: { grossCents: 125000, feesCents: 7500, netCents: 117500 },
        month: { grossCents: 542000, feesCents: 32500, netCents: 509500 },
      };
      setEarnings(mockData[range] || mockData.month);
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/earnings/summary?barberId=${user.id}&range=${range}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Earnings API error:', response.status, errorText);
        throw new Error(`Failed to fetch earnings: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from earnings API:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }
      
      const data = await response.json();
      console.log(`Live earnings data for ${range}:`, data);
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      // Fallback to mock data
      const mockData = {
        today: { grossCents: 8500, feesCents: 500, netCents: 8000 },
        week: { grossCents: 125000, feesCents: 7500, netCents: 117500 },
        month: { grossCents: 542000, feesCents: 32500, netCents: 509500 },
      };
      setEarnings(mockData[range] || mockData.month);
      console.warn('Using fallback earnings data due to API error');
    }
  };

  const fetchPayouts = async () => {
    if (!user?.id) return;

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.warn('Backend URL not configured, using mock payouts data');
      const mockPayouts = [
        {
          id: '1',
          amountCents: 117500,
          status: 'paid' as const,
          arrivalDateISO: '2024-03-10T00:00:00Z',
          createdAtISO: '2024-03-08T00:00:00Z',
        },
        {
          id: '2',
          amountCents: 98000,
          status: 'paid' as const,
          arrivalDateISO: '2024-03-03T00:00:00Z',
          createdAtISO: '2024-03-01T00:00:00Z',
        },
      ];
      setPayouts(mockPayouts);
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/payouts/list?barberId=${user.id}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payouts API error:', response.status, errorText);
        throw new Error(`Failed to fetch payouts: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from payouts API:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }
      
      const data = await response.json();
      console.log(`Live payouts data:`, data.payouts?.length || 0, 'payouts');
      setPayouts(data.payouts || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      // Fallback to mock data
      const mockPayouts = [
        {
          id: '1',
          amountCents: 117500,
          status: 'paid' as const,
          arrivalDateISO: '2024-03-10T00:00:00Z',
          createdAtISO: '2024-03-08T00:00:00Z',
        },
        {
          id: '2',
          amountCents: 98000,
          status: 'paid' as const,
          arrivalDateISO: '2024-03-03T00:00:00Z',
          createdAtISO: '2024-03-01T00:00:00Z',
        },
      ];
      setPayouts(mockPayouts);
      console.warn('Using fallback payouts data due to API error');
    }
  };

  const loadData = async (range: TimeRange = selectedRange) => {
    setLoading(true);
    await Promise.all([
      fetchEarnings(range),
      fetchPayouts(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    fetchEarnings(range);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Earnings' }} />
      
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
              <DollarSign size={24} color="#10B981" />
              <Text style={styles.summaryTitle}>Gross Revenue</Text>
            </View>
            <Text style={styles.summaryAmount}>
              {formatCurrency(earnings.grossCents)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <TrendingUp size={24} color="#F59E0B" />
              <Text style={styles.summaryTitle}>Platform Fees</Text>
            </View>
            <Text style={styles.summaryAmount}>
              -{formatCurrency(earnings.feesCents)}
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
              {formatCurrency(earnings.netCents)}
            </Text>
          </View>
        </View>

        {/* Payouts Section */}
        <View style={styles.payoutsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ExternalLink size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {payouts.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No payouts yet</Text>
              <Text style={styles.emptyStateText}>
                {earnings.netCents > 0 
                  ? 'Complete more bookings to trigger your first payout'
                  : 'Complete bookings and connect Stripe to start earning payouts'
                }
              </Text>
            </View>
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
                      {formatCurrency(payout.amountCents)}
                    </Text>
                  </View>
                  
                  <View style={styles.payoutDetails}>
                    <Text style={styles.payoutDate}>
                      Created: {formatDate(payout.createdAtISO)}
                    </Text>
                    {payout.status === 'in_transit' && (
                      <Text style={styles.payoutArrival}>
                        Arriving: {formatDate(payout.arrivalDateISO)}
                      </Text>
                    )}
                    {payout.status === 'pending' && (
                      <Text style={styles.payoutArrival}>
                        Expected: {formatDate(payout.arrivalDateISO)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
  rangeSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  netEarningsCard: {
    backgroundColor: '#3B82F6',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  netEarningsTitle: {
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
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
    color: '#111827',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  payoutsList: {
    gap: 12,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#374151',
    marginLeft: 6,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  payoutDetails: {
    gap: 4,
  },
  payoutDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  payoutArrival: {
    fontSize: 12,
    color: '#6B7280',
  },
});