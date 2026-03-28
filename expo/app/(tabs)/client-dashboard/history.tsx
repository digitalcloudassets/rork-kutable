import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import {
  Clock,
  Search,
  Calendar,
  User,
  Star,
  Filter,
  ChevronDown,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";
import type { Booking } from "@/types/models";
import { formatDate, formatTime } from "@/utils/dateHelpers";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

interface BookingHistoryCardProps {
  booking: Booking;
  onPress: () => void;
  onReview?: () => void;
}

function BookingHistoryCard({ booking, onPress, onReview }: BookingHistoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10B981";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const canReview = booking.status === "completed" && onReview;

  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.bookingHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formatDate(booking.startISO)}</Text>
          <View style={styles.timeRow}>
            <Clock size={14} color={Tokens.textMuted} />
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
          <User size={14} color={Tokens.textMuted} />
          <Text style={styles.barberName}>{booking.barberName}</Text>
        </View>
        {booking.note && (
          <Text style={styles.noteText} numberOfLines={2}>{booking.note}</Text>
        )}
      </View>

      {canReview && (
        <View style={styles.reviewSection}>
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={(e) => {
              e.stopPropagation();
              onReview();
            }}
          >
            <Star size={16} color={Tokens.accent} />
            <Text style={styles.reviewButtonText}>Leave Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function BookingHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ["booking-history", user?.id],
    queryFn: () => apiClient.bookings.list({ userId: user?.id }),
    enabled: !!user,
    retry: 2,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBookingPress = (bookingId: string) => {
    router.push(`/account/booking/${bookingId}`);
  };

  const handleReview = (bookingId: string) => {
    // Navigate to review screen or show review modal
    console.log("Review booking:", bookingId);
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings?.filter((booking: Booking) => {
    const matchesSearch = 
      booking.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.barberName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Sort by date (most recent first)
  const sortedBookings = filteredBookings.sort((a: Booking, b: Booking) => 
    new Date(b.startISO).getTime() - new Date(a.startISO).getTime()
  );

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon={User}
          title="Sign in required"
          description="Please sign in to view your booking history."
          actionLabel="Sign In"
          onAction={() => router.push("/auth/welcome")}
          testID="history-signin-required"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Tokens.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Tokens.textMuted}
          />
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Filter size={20} color={Tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      statusFilter === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setStatusFilter(option.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      statusFilter === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <ErrorState
            title="Unable to load booking history"
            message="Please check your internet connection and try again."
            onRetry={refetch}
            isRetrying={isLoading}
            testID="history-error-state"
          />
        ) : sortedBookings.length > 0 ? (
          <>
            <Text style={styles.resultsText}>
              {sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''} found
            </Text>
            {sortedBookings.map((booking: Booking) => (
              <BookingHistoryCard
                key={booking.id}
                booking={booking}
                onPress={() => handleBookingPress(booking.id)}
                onReview={booking.status === "completed" ? () => handleReview(booking.id) : undefined}
              />
            ))}
          </>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No booking history"
            description={
              searchQuery || statusFilter !== "all"
                ? "No bookings match your search criteria. Try adjusting your filters."
                : "Your completed and cancelled appointments will appear here."
            }
            actionLabel={searchQuery || statusFilter !== "all" ? "Clear Filters" : "Book Now"}
            onAction={() => {
              if (searchQuery || statusFilter !== "all") {
                setSearchQuery("");
                setStatusFilter("all");
              } else {
                router.push("/(tabs)/index" as any);
              }
            }}
            testID="history-empty-state"
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: Tokens.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Tokens.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Tokens.text,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  filtersContainer: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Tokens.bg,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  filterOptionActive: {
    backgroundColor: Tokens.accent,
    borderColor: Tokens.accent,
  },
  filterOptionText: {
    fontSize: 14,
    color: Tokens.textMuted,
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  bookingCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: Tokens.border,
    borderWidth: 1,
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
    color: Tokens.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: Tokens.textMuted,
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
    color: Tokens.text,
    marginBottom: 6,
  },
  barberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barberName: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginLeft: 6,
  },
  noteText: {
    fontSize: 13,
    color: Tokens.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  reviewSection: {
    borderTopWidth: 1,
    borderTopColor: Tokens.border,
    paddingTop: 12,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Tokens.accent,
    backgroundColor: `${Tokens.accent}10`,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Tokens.accent,
    marginLeft: 6,
  },
});