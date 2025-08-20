import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Calendar, Clock, User, ChevronRight, CalendarX, X } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { brandColors, BRAND } from "@/config/brand";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Booking } from "@/types/models";
import { formatDate, formatTime } from "@/utils/dateHelpers";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

interface RescheduleModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onReschedule: (bookingId: string, newStartISO: string) => void;
}

function RescheduleModal({ visible, booking, onClose, onReschedule }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: slots } = useQuery({
    queryKey: ["openSlots", booking?.barberId, booking?.serviceId, selectedDate],
    queryFn: () => {
      if (!booking || !selectedDate) return { slots: [] };
      return api.availability.openSlots({
        barberId: booking.barberId,
        serviceId: booking.serviceId,
        date: selectedDate,
      });
    },
    enabled: !!booking && !!selectedDate,
  });

  const handleReschedule = async () => {
    if (!booking || !selectedSlot) return;
    
    setIsLoading(true);
    try {
      await onReschedule(booking.id, selectedSlot);
      onClose();
    } catch (error) {
      console.error('Error rescheduling:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reschedule Appointment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={BRAND.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Select New Date</Text>
          <View style={styles.dateGrid}>
            {generateDateOptions().map((date) => {
              const dateObj = new Date(date);
              const isSelected = selectedDate === date;
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateOption, isSelected && styles.selectedDateOption]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot("");
                  }}
                >
                  <Text style={[styles.dateOptionText, isSelected && styles.selectedDateOptionText]}>
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateOptionDate, isSelected && styles.selectedDateOptionText]}>
                    {dateObj.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDate && (
            <>
              <Text style={styles.sectionTitle}>Available Times</Text>
              <View style={styles.slotsGrid}>
                {slots?.slots?.map((slot: string) => {
                  const slotTime = new Date(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotOption, isSelected && styles.selectedSlotOption]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotOptionText, isSelected && styles.selectedSlotOptionText]}>
                        {slotTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.rescheduleButton, (!selectedSlot || isLoading) && styles.disabledButton]}
            onPress={handleReschedule}
            disabled={!selectedSlot || isLoading}
          >
            <Text style={styles.rescheduleButtonText}>
              {isLoading ? "Rescheduling..." : "Confirm Reschedule"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function BookingsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [rescheduleModal, setRescheduleModal] = useState<{ visible: boolean; booking: Booking | null }>({ visible: false, booking: null });

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => api.bookings.list({ userId: user?.id }),
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) => 
      api.bookings.cancel({ bookingId, reason, userId: user?.id || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
      Alert.alert("Success", "Booking cancelled successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to cancel booking");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ bookingId, newStartISO }: { bookingId: string; newStartISO: string }) => 
      api.bookings.reschedule({ bookingId, newStartISO, userId: user?.id || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
      Alert.alert("Success", "Booking rescheduled successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to reschedule booking");
    },
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

  const handleBookingPress = (booking: Booking) => {
    router.push(`/account/booking/${booking.id}`);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => cancelMutation.mutate({ bookingId: booking.id }),
        },
      ]
    );
  };

  const handleReschedule = (booking: Booking) => {
    setRescheduleModal({ visible: true, booking });
  };

  const onReschedule = async (bookingId: string, newStartISO: string) => {
    await rescheduleMutation.mutateAsync({ bookingId, newStartISO });
  };

  return (
    <Screen>
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
            <TouchableOpacity 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => handleBookingPress(booking)}
              testID={`booking-card-${booking.id}`}
            >
              <View style={styles.bookingHeader}>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateText}>{formatDate(booking.startISO)}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={14} color={BRAND.TEXT_SECONDARY} />
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
                  <User size={14} color={BRAND.TEXT_SECONDARY} />
                  <Text style={styles.barberName}>{booking.barberName}</Text>
                </View>
                {booking.note && (
                  <Text style={styles.noteText} numberOfLines={2}>{booking.note}</Text>
                )}
              </View>

              {activeTab === "upcoming" && (booking.status === "confirmed" || booking.status === "pending") && (
                <View style={styles.bookingActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReschedule(booking);
                    }}
                    testID={`reschedule-button-${booking.id}`}
                  >
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel(booking);
                    }}
                    testID={`cancel-button-${booking.id}`}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ChevronRight size={20} color="#ccc" style={styles.chevron} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      <RescheduleModal
        visible={rescheduleModal.visible}
        booking={rescheduleModal.booking}
        onClose={() => setRescheduleModal({ visible: false, booking: null })}
        onReschedule={onReschedule}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Tokens.surface,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
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

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 12,
    marginTop: 16,
  },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dateOption: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Tokens.surface,
  },
  selectedDateOption: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  dateOptionText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  dateOptionDate: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
  },
  selectedDateOptionText: {
    color: "#fff",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: Tokens.surface,
  },
  selectedSlotOption: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  slotOptionText: {
    fontSize: 14,
    color: Tokens.text,
  },
  selectedSlotOptionText: {
    color: "#fff",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Tokens.border,
  },
  rescheduleButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  rescheduleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});