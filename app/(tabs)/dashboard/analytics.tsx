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
import { brandColors } from '../../../config/brand';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import type { AnalyticsSummary, TimeSeriesPoint, TopService } from '@/backend/types';

type RangeType = 'week' | 'month';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState<RangeType>('month');
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['analytics-summary', user?.id, selectedRange],
    queryFn: async () => {
      console.log(`Fetching analytics summary for barber ${user?.id}, range: ${selectedRange}`);
      const result = await api.analytics.summary({ barberId: user?.id || '', range: selectedRange });
      console.log(`Analytics summary result:`, result);
      return result;
    },
    enabled: !!user && user.role === 'barber',
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
      const result = await api.analytics.timeseries({
        barberId: user?.id || '',
        start: start.toISOString(),
        end: now.toISOString(),
        bucket: 'day',
      });
      console.log(`Timeseries result:`, result?.timeSeries?.length || 0, 'data points');
      return result;
    },
    enabled: !!user && user.role === 'barber',
  });

  const { data: topServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['analytics-top-services', user?.id],
    queryFn: async () => {
      console.log(`Fetching top services for barber ${user?.id}`);
      const result = await api.analytics.topServices({ barberId: user?.id || '', range: 'month' });
      console.log(`Top services result:`, result?.topServices?.length || 0, 'services');
      return result;
    },
    enabled: !!user && user.role === 'barber',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSummary();
    setRefreshing(false);
  };

  if (!user || user.role !== 'barber') {
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
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { borderLeftColor: '#3B82F6' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#3B82F615' }]}>
                <Calendar size={20} color="#3B82F6" />
              </View>
              <Text style={styles.summaryValue}>{summary?.bookingsCount || 0}</Text>
              <Text style={styles.summaryLabel}>Bookings</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#10B98115' }]}>
                <DollarSign size={20} color="#10B981" />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.grossCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Gross</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: '#8B5CF6' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#8B5CF615' }]}>
                <TrendingUp size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.netCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Net</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B15' }]}>
                <Users size={20} color="#F59E0B" />
              </View>
              <Text style={styles.summaryValue}>
                ${((summary?.avgTicketCents || 0) / 100).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Avg Ticket</Text>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EF444415' }]}>
                <XCircle size={20} color="#EF4444" />
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
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Bookings</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Revenue</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.chartContainer}>
              {timeseries?.timeSeries?.length > 0 ? (
                <View style={styles.barChart}>
                  {timeseries.timeSeries.slice(-7).map((point: TimeSeriesPoint, index: number) => {
                    const maxBookings = Math.max(...timeseries.timeSeries.map((p: TimeSeriesPoint) => p.bookingsCount), 1);
                    const maxRevenue = Math.max(...timeseries.timeSeries.map((p: TimeSeriesPoint) => p.grossCents), 1);
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
                                backgroundColor: '#3B82F6',
                                marginRight: 2,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.bar,
                              {
                                height: revenueHeight,
                                backgroundColor: '#10B981',
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
                  <BarChart3 size={48} color="#ccc" />
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
              {topServices?.topServices?.length > 0 ? (
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
                              (service.grossCents / (topServices.topServices[0]?.grossCents || 1)) * 100,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rangeChipActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  rangeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
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
    color: '#1a1a1a',
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
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#666',
    textAlign: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  servicesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.primary,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  serviceStats: {
    fontSize: 13,
    color: '#666',
  },
  serviceProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  serviceProgressBar: {
    height: '100%',
    backgroundColor: brandColors.primary,
    borderRadius: 2,
  },
  emptyServices: {
    padding: 24,
    alignItems: 'center',
  },
  emptyServicesText: {
    fontSize: 14,
    color: '#999',
  },
});