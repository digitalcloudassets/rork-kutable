import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Calendar, Clock, DollarSign, Settings, TrendingUp, Users } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Booking } from "@/types/models";
import { formatTime } from "@/utils/dateHelpers";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const { data: todayBookings, isLoading, refetch } = useQuery({
    queryKey: ["barber-bookings", user?.id, today],
    queryFn: () => api.bookings.list({ barberId: user?.id, date: today }),
    enabled: !!user && user.role === "barber",
  });

  const { data: earnings } = useQuery({
    queryKey: ["earnings", user?.id],
    queryFn: () => api.earnings.summary({ barberId: user?.id, range: "month" }),
    enabled: !!user && user.role === "barber",
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const stats = [
    {
      label: "Today's Bookings",
      value: todayBookings?.length || 0,
      icon: Calendar,
      color: "#3B82F6",
    },
    {
      label: "This Month",
      value: `$${((earnings?.netCents || 0) / 100).toFixed(0)}`,
      icon: DollarSign,
      color: "#10B981",
    },
    {
      label: "Clients",
      value: "47",
      icon: Users,
      color: "#8B5CF6",
    },
    {
      label: "Growth",
      value: "+12%",
      icon: TrendingUp,
      color: "#F59E0B",
    },
  ];

  if (!user || user.role !== "barber") {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Barber Dashboard</Text>
          <Text style={styles.emptyText}>Sign up as a barber to access this dashboard</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push("/barber-onboarding")}
          >
            <Text style={styles.ctaButtonText}>Become a Barber</Text>
          </TouchableOpacity>
        </View>
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
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
              <stat.icon size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View Calendar</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={brandColors.primary} />
        ) : todayBookings?.length === 0 ? (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyScheduleText}>No bookings for today</Text>
          </View>
        ) : (
          todayBookings?.map((booking: Booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingTime}>
                <Clock size={16} color="#666" />
                <Text style={styles.timeText}>{formatTime(booking.startISO)}</Text>
              </View>
              <View style={styles.bookingDetails}>
                <Text style={styles.clientName}>{booking.clientName}</Text>
                <Text style={styles.serviceName}>{booking.serviceName}</Text>
              </View>
              <TouchableOpacity style={styles.statusButton}>
                <Text style={styles.statusButtonText}>
                  {booking.status === "confirmed" ? "Check In" : booking.status}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/manage-services")}
          >
            <Settings size={24} color={brandColors.primary} />
            <Text style={styles.actionText}>Manage Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Calendar size={24} color={brandColors.primary} />
            <Text style={styles.actionText}>Block Time</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/earnings-details")}
          >
            <DollarSign size={24} color={brandColors.primary} />
            <Text style={styles.actionText}>View Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Users size={24} color={brandColors.primary} />
            <Text style={styles.actionText}>Client List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  viewAllText: {
    fontSize: 14,
    color: brandColors.primary,
    fontWeight: "500",
  },
  emptySchedule: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyScheduleText: {
    fontSize: 14,
    color: "#999",
  },
  bookingItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  bookingTime: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
  },
  bookingDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 13,
    color: "#666",
  },
  statusButton: {
    backgroundColor: brandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: brandColors.primary,
  },
  quickActions: {
    padding: 16,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
});