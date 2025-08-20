import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  Calendar,
  User,
  MapPin,
  Phone,
  MessageSquare,
  Share,
  X,
  CalendarPlus,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Booking } from "@/types/models";
import { formatDate, formatTime } from "@/utils/dateHelpers";
import { addToCalendar, shareBooking, type BookingDetails } from "@/utils/calendarAndSharing";
import { ErrorState } from "@/components/ErrorState";

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Get booking from cache or fetch it
  const { data: bookings } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => api.bookings.list({ userId: user?.id }),
    enabled: !!user,
  });

  const booking = bookings?.find((b: Booking) => b.id === id);

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) => 
      api.bookings.cancel({ bookingId, reason, userId: user?.id || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
      Alert.alert("Success", "Booking cancelled successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to cancel booking");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "#10B981";
      case "pending": return "#F59E0B";
      case "cancelled": return "#EF4444";
      case "completed": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return "✓";
      case "pending": return "⏳";
      case "cancelled": return "✕";
      case "completed": return "✓";
      default: return "?";
    }
  };

  const handleCancel = () => {
    if (!booking) return;
    
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

  const handleReschedule = () => {
    if (!booking) return;
    // Navigate back to bookings with reschedule modal
    router.back();
    // Note: In a real implementation, you might want to pass parameters to open the reschedule modal
  };

  const handleAddToCalendar = async () => {
    if (!booking) return;
    
    setIsAddingToCalendar(true);
    try {
      const bookingDetails: BookingDetails = {
        barberName: booking.barberName || "Barber",
        serviceName: booking.serviceName || "Service",
        startTime: booking.startISO,
        endTime: booking.endISO,
        location: "Barber Shop", // This would come from barber data
        address: "123 Main St", // This would come from barber data
        notes: booking.note,
      };
      
      await addToCalendar(bookingDetails);
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleShare = async () => {
    if (!booking) return;
    
    setIsSharing(true);
    try {
      const bookingDetails: BookingDetails = {
        barberName: booking.barberName || "Barber",
        serviceName: booking.serviceName || "Service",
        startTime: booking.startISO,
        endTime: booking.endISO,
        location: "Barber Shop", // This would come from barber data
        address: "123 Main St", // This would come from barber data
        notes: booking.note,
      };
      
      await shareBooking(bookingDetails);
    } catch (error) {
      console.error('Error sharing booking:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Booking Details" }} />
        <ErrorState
          title="Booking Not Found"
          message="The booking you're looking for could not be found."
          onRetry={() => router.back()}
          testID="booking-not-found"
        />
      </SafeAreaView>
    );
  }

  const startTime = new Date(booking.startISO);
  const endTime = new Date(booking.endISO);
  const isUpcoming = startTime > new Date();
  const canModify = isUpcoming && (booking.status === "confirmed" || booking.status === "pending");

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Booking Details",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(booking.status)}</Text>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Main Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.bookingId}>#{booking.id.slice(-6)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={20} color={brandColors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {formatDate(booking.startISO)} at {formatTime(booking.startISO)}
              </Text>
              <Text style={styles.detailSubtext}>
                Duration: {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} minutes
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <User size={20} color={brandColors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Barber</Text>
              <Text style={styles.detailValue}>{booking.barberName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={20} color={brandColors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>Barber Shop</Text>
              <Text style={styles.detailSubtext}>123 Main St, City, State</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Phone size={20} color={brandColors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{booking.clientPhone}</Text>
            </View>
          </View>

          {booking.note && (
            <View style={styles.detailRow}>
              <MessageSquare size={20} color={brandColors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{booking.note}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddToCalendar}
            disabled={isAddingToCalendar}
            testID="add-to-calendar-button"
          >
            <CalendarPlus size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>
              {isAddingToCalendar ? "Adding..." : "Add to Calendar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            disabled={isSharing}
            testID="share-button"
          >
            <Share size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>
              {isSharing ? "Sharing..." : "Share"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modify Booking Actions */}
        {canModify && (
          <View style={styles.modifyCard}>
            <Text style={styles.modifyTitle}>Modify Booking</Text>
            <View style={styles.modifyActions}>
              <TouchableOpacity 
                style={styles.rescheduleButton}
                onPress={handleReschedule}
                testID="reschedule-detail-button"
              >
                <Text style={styles.rescheduleButtonText}>Reschedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
                testID="cancel-detail-button"
              >
                <Text style={styles.cancelButtonText}>
                  {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  
  statusHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
    color: "#fff",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  bookingId: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: 14,
    color: "#999",
  },

  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: brandColors.primary,
  },

  modifyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modifyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  modifyActions: {
    gap: 12,
  },
  rescheduleButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  rescheduleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});