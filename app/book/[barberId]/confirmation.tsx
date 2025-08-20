import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, Calendar, Clock, MapPin, User, Share2 } from "lucide-react-native";
import { brandColors } from "@/config/brand";
import { useBooking } from "@/providers/BookingProvider";
import { addToCalendar, shareBooking, type BookingDetails } from "@/utils/calendarAndSharing";
import { usePushNotifications } from "@/utils/usePushNotifications";

export default function ConfirmationScreen() {
  const router = useRouter();
  const { selectedBarber, selectedService, selectedTime, clientDetails, clearBooking } = useBooking();
  const { registerForPushNotifications } = usePushNotifications();
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Animation values
  const scaleAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Register for push notifications and animate success when confirmation loads
  useEffect(() => {
    registerForPushNotifications();
    
    // Success animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [registerForPushNotifications, scaleAnim, fadeAnim]);

  const handleDone = () => {
    clearBooking();
    router.replace("/(tabs)/bookings");
  };

  const handleAddToCalendar = async () => {
    if (!selectedBarber || !selectedService || !selectedTime) return;
    
    setIsAddingToCalendar(true);
    
    const bookingDetails: BookingDetails = {
      barberName: selectedBarber.name,
      serviceName: selectedService.name,
      startTime: selectedTime.startISO,
      endTime: selectedTime.endISO,
      location: selectedBarber.shopName || 'Barbershop',
      address: selectedBarber.shopAddress || 'Address not available',
      notes: clientDetails?.note,
    };
    
    await addToCalendar(bookingDetails);
    setIsAddingToCalendar(false);
  };

  const handleShare = async () => {
    if (!selectedBarber || !selectedService || !selectedTime) return;
    
    setIsSharing(true);
    
    const bookingDetails: BookingDetails = {
      barberName: selectedBarber.name,
      serviceName: selectedService.name,
      startTime: selectedTime.startISO,
      endTime: selectedTime.endISO,
      location: selectedBarber.shopName || 'Barbershop',
      address: selectedBarber.shopAddress || 'Address not available',
      notes: clientDetails?.note,
    };
    
    await shareBooking(bookingDetails);
    setIsSharing(false);
  };

  // Format display data
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.successContainer}>
        <Animated.View 
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <CheckCircle size={64} color="#10B981" />
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment has been successfully booked
          </Text>
        </Animated.View>
      </View>

      <View style={styles.bookingCard}>
        <Text style={styles.cardTitle}>Booking Details</Text>
        
        <View style={styles.detailRow}>
          <User size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{selectedService?.name || 'Service'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <User size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Barber</Text>
            <Text style={styles.detailValue}>{selectedBarber?.name || 'Barber'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Calendar size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {selectedTime ? formatDate(selectedTime.startISO) : 'Date'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {selectedTime ? `${formatTime(selectedTime.startISO)} - ${formatTime(selectedTime.endISO)}` : 'Time'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{selectedBarber?.shopName || 'Barbershop'}</Text>
            <Text style={styles.detailAddress}>{selectedBarber?.shopAddress || 'Address not available'}</Text>
          </View>
        </View>

        {clientDetails?.note && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailValue}>{clientDetails.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.reminderCard}>
        <Text style={styles.reminderTitle}>What&apos;s Next?</Text>
        <Text style={styles.reminderText}>
          • We&apos;ve sent a confirmation to your phone
        </Text>
        <Text style={styles.reminderText}>
          • You&apos;ll receive a reminder 24 hours before
        </Text>
        <Text style={styles.reminderText}>
          • Free cancellation up to 24 hours before
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, isAddingToCalendar && styles.actionButtonDisabled]} 
            onPress={handleAddToCalendar}
            disabled={isAddingToCalendar}
          >
            {isAddingToCalendar ? (
              <ActivityIndicator size="small" color={brandColors.primary} />
            ) : (
              <Calendar size={20} color={brandColors.primary} />
            )}
            <Text style={styles.actionButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isSharing && styles.actionButtonDisabled]} 
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={brandColors.primary} />
            ) : (
              <Share2 size={20} color={brandColors.primary} />
            )}
            <Text style={styles.actionButtonText}>Share</Text>
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
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  bookingCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  detailAddress: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  reminderCard: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 13,
    color: "#065F46",
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
  },
  doneButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.primary,
    backgroundColor: "#fff",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: brandColors.primary,
    marginLeft: 8,
  },
});