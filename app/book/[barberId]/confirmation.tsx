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
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
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
    <Screen>
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
          <CheckCircle size={64} color={Tokens.success} />
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
          <User size={16} color={Tokens.textMuted} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{selectedService?.name || 'Service'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <User size={16} color={Tokens.textMuted} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Barber</Text>
            <Text style={styles.detailValue}>{selectedBarber?.name || 'Barber'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Calendar size={16} color={Tokens.textMuted} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {selectedTime ? formatDate(selectedTime.startISO) : 'Date'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color={Tokens.textMuted} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {selectedTime ? `${formatTime(selectedTime.startISO)} - ${formatTime(selectedTime.endISO)}` : 'Time'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={16} color={Tokens.textMuted} />
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
              <ActivityIndicator size="small" color={Tokens.accent} />
            ) : (
              <Calendar size={20} color={Tokens.accent} />
            )}
            <Text style={styles.actionButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isSharing && styles.actionButtonDisabled]} 
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={Tokens.accent} />
            ) : (
              <Share2 size={20} color={Tokens.accent} />
            )}
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: Tokens.surface,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Tokens.text,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Tokens.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  bookingCard: {
    backgroundColor: Tokens.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
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
    color: Tokens.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: Tokens.text,
  },
  detailAddress: {
    fontSize: 13,
    color: Tokens.textMuted,
    marginTop: 2,
  },
  reminderCard: {
    backgroundColor: Tokens.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Tokens.success + '40',
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.success,
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 13,
    color: Tokens.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
  },
  doneButton: {
    backgroundColor: Tokens.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
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
    borderColor: Tokens.accent,
    backgroundColor: Tokens.surface,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Tokens.accent,
    marginLeft: 8,
  },
});