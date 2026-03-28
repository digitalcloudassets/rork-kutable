import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock, AlertCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";

export default function SelectTimeScreen() {
  const router = useRouter();
  const { selectedBarber, selectedService, setSelectedTime } = useBooking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Get device timezone
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format date as YYYY-MM-DD for the API
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const { data: slotsData, isLoading, error } = useQuery({
    queryKey: [
      "openSlots", 
      selectedBarber?.id, 
      selectedService?.id, 
      formatDateForAPI(selectedDate),
      deviceTimezone
    ],
    queryFn: () => {
      if (!selectedBarber?.id || !selectedService?.id) {
        throw new Error('Missing barber or service');
      }
      return api.availability.openSlots({
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        date: formatDateForAPI(selectedDate),
        tz: deviceTimezone,
      });
    },
    enabled: !!selectedBarber?.id && !!selectedService?.id,
  });

  const handleContinue = () => {
    if (selectedSlot && selectedService) {
      const startISO = selectedSlot;
      const endISO = new Date(
        new Date(startISO).getTime() + selectedService.durationMinutes * 60 * 1000
      ).toISOString();
      
      setSelectedTime({ startISO, endISO });
      router.push("/booking/details");
    }
  };

  // Format slot time for display (12-hour format)
  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const availableSlots = slotsData?.slots || [];

  const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <Text style={styles.headerSubtitle}>
          {selectedService?.name} with {selectedBarber?.name}
        </Text>
      </View>

      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nextSevenDays.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isSelected && styles.selectedDateText]}>
                  {date.toLocaleDateString("en", { weekday: "short" })}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.selectedDateText]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.timeSlotsContainer}>
        <Text style={styles.sectionTitle}>Available Times</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.primary} />
            <Text style={styles.loadingText}>Finding available times...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Unable to load times</Text>
            <Text style={styles.errorText}>Please try selecting a different date</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No available times</Text>
            <Text style={styles.emptyText}>Please pick another date to see available slots</Text>
            <TouchableOpacity 
              style={styles.pickDateButton}
              onPress={() => {
                // Reset to today if current selection has no slots
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
              }}
            >
              <Text style={styles.pickDateButtonText}>Pick Another Date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timeSlotsGrid}>
            {availableSlots.map((slotISO: string) => {
              const isSelected = selectedSlot === slotISO;
              return (
                <TouchableOpacity
                  key={slotISO}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.selectedSlot,
                  ]}
                  onPress={() => setSelectedSlot(slotISO)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.selectedSlotText,
                    ]}
                  >
                    {formatSlotTime(slotISO)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedSlot && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedSlot}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  dateSelector: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    minWidth: 60,
  },
  selectedDateCard: {
    backgroundColor: brandColors.primary,
  },
  dayName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  selectedDateText: {
    color: "#fff",
  },
  timeSlotsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: "30%",
    alignItems: "center",
  },
  selectedSlot: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  selectedSlotText: {
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    marginBottom: 20,
  },
  pickDateButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  pickDateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  continueButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});