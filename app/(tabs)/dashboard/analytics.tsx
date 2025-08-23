import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, XCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';
import type { AnalyticsSummary, TimeSeriesPoint, TopService } from '@/backend/types';

type RangeType = 'week' | 'month';

export default function AnalyticsScreen() {
  const { user, role, ready } = useAuth();
  const [selectedRange, setSelectedRange] = useState<RangeType>('month');
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['analytics-summary', user?.id, selectedRange],
    queryFn: async () => {
      console.log(`Fetching analytics summary for barber ${user?.id}, range: ${selectedRange}`);
      const result = await apiClient.analytics.summary({ barberId: user?.id || '', range: selectedRange });
      console.log(`Analytics summary result:`, result);
      return result;
    },
    enabled: !!user && role === 'barber',
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ['analytics-timeseries', user?.id, selectedRange],
    queryFn: async () => {
      const now = new Date();
      let start: Date;
      
      if (selectedRange === 'week') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      console.log(`Fetching timeseries data for barber ${user?.id}, range: ${selectedRange}`);
      const result = await apiClient.analytics.timeseries({
        barberId: user?.id || '',
        start: start.toISOString(),
        end: now.toISOString(),
        bucket: 'day',
      });
      console.log(`Timeseries result:`, result?.timeSeries?.length || 0, 'data points');
      return result;
    },
    enabled: !!user && role === 'barber',
  });

  const { data: topServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['analytics-top-services', user?.id],
    queryFn: async () => {
      console.log(`Fetching top services for barber ${user?.id}`);
      const result = await apiClient.analytics.topServices({ barberId: user?.id || '', range: 'month' });
      console.log(`Top services result:`, result?.topServices?.length || 0, 'services');
      return result;
    },
    enabled: !!user && role === 'barber',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSummary();
    setRefreshing(false);
  };

  if (!ready) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Tokens.accent} />
        </View>
      </View>
    );
  }

  if (!user || role !== 'barber') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Analytics</Text>
          <Text style={styles.emptyText}>Sign up as a barber to access analytics</Text>
        </View>
      </View>
    );
  }

  const isLoading = summaryLoading || timeseriesLoading || servicesLoading;

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
      {/* Range Selector */}
      <View style={styles.rangeSelector}>
        <TouchableOpacity
          style={[
            styles.rangeChip,
            selectedRange === 'week' && styles.rangeChipActive,
          ]}
          onPress={() => setSelectedRange('week')}
        >
          <Text
            style={[
              styles.rangeChipText,
              selectedRange === 'week' && styles.rangeChipTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.rangeChip,
            selectedRange === 'month' && styles.rangeChipActive,
          ]}
          onPress={() => setSelectedRange('month')}
        >
          <Text
            style={[
              styles.rangeChipText,
              selectedRange === 'month' && styles.rangeChipTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Tokens.accent} />
        </View>
      ) : (
        <>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { borderLeftColor: Tokens.accent }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${Tokens.accent}15` }]}>
                <Calendar size={20} color={Tokens.accent} />
              </View>
              <Text style={styles.summaryValue}>{summary?.bookingsCount || 0}</Text>
              <Text style={styles.summaryLabel}>Bookings</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: Tokens.success }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${Tokens.success}15` }]}>
                <DollarSign size={20} color={Tokens.success} />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.grossCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Gross</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: Tokens.accent }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${Tokens.accent}15` }]}>
                <TrendingUp size={20} color={Tokens.accent} />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.netCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Net</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: Tokens.warning }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${Tokens.warning}15` }]}>
                <Users size={20} color={Tokens.warning} />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.avgTicketCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Avg Ticket</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: Tokens.error }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${Tokens.error}15` }]}>
                <XCircle size={20} color={Tokens.error} />
              </View>
              <Text style={styles.summaryValue}>{summary?.cancellationsCount || 0}</Text>
              <Text style={styles.summaryLabel}>Cancellations</Text>
            </View>
          </View>

          {/* Trends Chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trends</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Tokens.accent }]} />
                  <Text style={styles.legendText}>Bookings</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Tokens.success }]} />
                  <Text style={styles.legendText}>Revenue</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.chartContainer}>
              {timeseries?.timeSeries && timeseries.timeSeries.length > 0 ? (
                <View style={styles.barChart}>
                  {timeseries.timeSeries.slice(-7).map((point: TimeSeriesPoint, index: number) => {
                    const maxBookings = Math.max(...(timeseries?.timeSeries?.map((p: TimeSeriesPoint) => p.bookingsCount) || [1]), 1);
                    const maxRevenue = Math.max(...(timeseries?.timeSeries?.map((p: TimeSeriesPoint) => p.grossCents) || [1]), 1);
                    const bookingHeight = maxBookings > 0 ? Math.max((point.bookingsCount / maxBookings) * 80, 2) : 2;
                    const revenueHeight = maxRevenue > 0 ? Math.max((point.grossCents / maxRevenue) * 80, 2) : 2;
                    
                    return (
                      <View key={`${point.date}-${index}`} style={styles.barGroup}>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: bookingHeight,
                                backgroundColor: Tokens.accent,
                                marginRight: 2,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.bar,
                              {
                                height: revenueHeight,
                                backgroundColor: Tokens.success,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>
                          {new Date(point.date).getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <BarChart3 size={48} color={Tokens.textMuted} />
                  <Text style={styles.emptyChartText}>
                    {selectedRange === 'week' ? 'No bookings this week' : 'No bookings this month'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Top Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Services (This Month)</Text>
            <View style={styles.servicesList}>
              {topServices?.topServices && topServices.topServices.length > 0 ? (
                topServices.topServices.map((service: TopService, index: number) => (
                  <View key={service.serviceId} style={styles.serviceItem}>
                    <View style={styles.serviceRank}>
                      <Text style={styles.serviceRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceName}>{service.serviceName}</Text>
                      <Text style={styles.serviceStats}>
                        {service.bookingsCount} bookings • ${(service.grossCents / 100).toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.serviceProgress}>
                      <View
                        style={[
                          styles.serviceProgressBar,
                          {
                            width: `${Math.min(
                              (service.grossCents / (topServices?.topServices?.[0]?.grossCents || 1)) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyServices}>
                  <Text style={styles.emptyServicesText}>
                    {summary?.bookingsCount === 0 
                      ? 'No completed bookings this month'
                      : 'No services data available'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Tokens.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Tokens.textMuted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Tokens.surface,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  rangeChipActive: {
    backgroundColor: Tokens.accent,
    borderColor: Tokens.accent,
  },
  rangeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Tokens.textMuted,
  },
  rangeChipTextActive: {
    color: '#fff',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Tokens.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Tokens.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Tokens.textMuted,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Tokens.textMuted,
  },
  chartContainer: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 8,
  },
  bar: {
    width: 8,
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: Tokens.textMuted,
    textAlign: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  emptyChartText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginTop: 8,
  },
  servicesList: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Tokens.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: Tokens.accent,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Tokens.text,
    marginBottom: 2,
  },
  serviceStats: {
    fontSize: 13,
    color: Tokens.textMuted,
  },
  serviceProgress: {
    width: 60,
    height: 4,
    backgroundColor: Tokens.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  serviceProgressBar: {
    height: '100%',
    backgroundColor: Tokens.accent,
    borderRadius: 2,
  },
  emptyServices: {
    padding: 24,
    alignItems: 'center',
  },
  emptyServicesText: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
});