import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, Calendar, Clock, MapPin, User } from "lucide-react-native";
import { brandColors } from "@/config/brand";

export default function ConfirmationScreen() {
  const router = useRouter();

  const handleDone = () => {
    router.replace("/(tabs)/bookings");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.successContainer}>
        <CheckCircle size={64} color="#10B981" />
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your appointment has been successfully booked
        </Text>
      </View>

      <View style={styles.bookingCard}>
        <Text style={styles.cardTitle}>Booking Details</Text>
        
        <View style={styles.detailRow}>
          <User size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Barber</Text>
            <Text style={styles.detailValue}>Marcus Johnson</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Calendar size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>Tomorrow, March 15</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>2:00 PM</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={16} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>Elite Cuts Barbershop</Text>
            <Text style={styles.detailAddress}>123 Main St, Downtown</Text>
          </View>
        </View>
      </View>

      <View style={styles.reminderCard}>
        <Text style={styles.reminderTitle}>What's Next?</Text>
        <Text style={styles.reminderText}>
          • We've sent a confirmation to your phone
        </Text>
        <Text style={styles.reminderText}>
          • You'll receive a reminder 24 hours before
        </Text>
        <Text style={styles.reminderText}>
          • Free cancellation up to 24 hours before
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addToCalendarButton}>
          <Calendar size={20} color={brandColors.primary} />
          <Text style={styles.addToCalendarText}>Add to Calendar</Text>
        </TouchableOpacity>
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
  addToCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.primary,
  },
  addToCalendarText: {
    fontSize: 16,
    fontWeight: "500",
    color: brandColors.primary,
    marginLeft: 8,
  },
});