import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Clock, AlertCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { apiClient } from "@/lib/api";

export default function SelectTimeScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
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
      return apiClient.availability.openSlots({
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
      router.push(`/book/${barberId}/details`);
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
    <Screen>
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
            <ActivityIndicator size="large" color={Tokens.accent} />
            <Text style={styles.loadingText}>Finding available times...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={Tokens.error} />
            <Text style={styles.errorTitle}>Unable to load times</Text>
            <Text style={styles.errorText}>Please try selecting a different date</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={48} color={Tokens.textMuted} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Tokens.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Tokens.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Tokens.textMuted,
  },
  dateSelector: {
    backgroundColor: Tokens.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  dateCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: Tokens.bg,
    borderWidth: 1,
    borderColor: Tokens.border,
    minWidth: 60,
  },
  selectedDateCard: {
    backgroundColor: Tokens.accent,
    borderColor: Tokens.accent,
  },
  dayName: {
    fontSize: 12,
    color: Tokens.textMuted,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
  },
  selectedDateText: {
    color: "white",
  },
  timeSlotsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 12,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    backgroundColor: Tokens.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Tokens.border,
    minWidth: "30%",
    alignItems: "center",
  },
  selectedSlot: {
    backgroundColor: Tokens.accent,
    borderColor: Tokens.accent,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
    color: Tokens.text,
  },
  selectedSlotText: {
    color: "white",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Tokens.textMuted,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: Tokens.textMuted,
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
    color: Tokens.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginTop: 4,
    textAlign: "center",
    marginBottom: 20,
  },
  pickDateButton: {
    backgroundColor: Tokens.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  pickDateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: Tokens.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Tokens.border,
  },
  continueButton: {
    backgroundColor: Tokens.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Tokens.textMuted,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});