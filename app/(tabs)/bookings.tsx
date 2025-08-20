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
import { Calendar, Clock, User, ChevronRight, CalendarX } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Booking } from "@/types/models";
import { formatDate, formatTime } from "@/utils/dateHelpers";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

export default function BookingsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => api.bookings.list({ userId: user?.id }),
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const now = new Date();
  const upcomingBookings = bookings?.filter((b: Booking) => new Date(b.startISO) >= now) || [];
  const pastBookings = bookings?.filter((b: Booking) => new Date(b.startISO) < now) || [];

  const displayBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "#10B981";
      case "pending": return "#F59E0B";
      case "cancelled": return "#EF4444";
      case "completed": return "#6B7280";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!user ? (
          <EmptyState
            icon={User}
            title="Sign in required"
            description="Please sign in to view your bookings and manage appointments."
            actionLabel="Sign In"
            onAction={() => {}}
            testID="bookings-signin-required"
          />
        ) : error ? (
          <ErrorState
            title="Unable to load bookings"
            message="Please check your internet connection and try again."
            onRetry={refetch}
            isRetrying={isLoading}
            testID="bookings-error-state"
          />
        ) : isLoading ? (
          <ActivityIndicator size="large" color={brandColors.primary} style={styles.loader} />
        ) : displayBookings.length === 0 ? (
          <EmptyState
            icon={activeTab === "upcoming" ? Calendar : CalendarX}
            title={`No ${activeTab} bookings`}
            description={
              activeTab === "upcoming" 
                ? "Book a service to see your upcoming appointments here."
                : "Your completed bookings will appear here once you've had some appointments."
            }
            actionLabel={activeTab === "upcoming" ? "Find Barbers" : undefined}
            onAction={activeTab === "upcoming" ? () => {} : undefined}
            testID={`bookings-empty-${activeTab}`}
          />
        ) : (
          displayBookings.map((booking: Booking) => (
            <TouchableOpacity key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateText}>{formatDate(booking.startISO)}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.timeText}>{formatTime(booking.startISO)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
              
              <View style={styles.bookingBody}>
                <Text style={styles.serviceName}>{booking.serviceName}</Text>
                <View style={styles.barberRow}>
                  <User size={14} color="#666" />
                  <Text style={styles.barberName}>{booking.barberName}</Text>
                </View>
                {booking.note && (
                  <Text style={styles.noteText} numberOfLines={2}>{booking.note}</Text>
                )}
              </View>

              {activeTab === "upcoming" && booking.status === "confirmed" && (
                <View style={styles.bookingActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ChevronRight size={20} color="#ccc" style={styles.chevron} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: brandColors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: brandColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },

  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingBody: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  barberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barberName: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  noteText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandColors.primary,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: brandColors.primary,
  },
  cancelButton: {
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  chevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
});