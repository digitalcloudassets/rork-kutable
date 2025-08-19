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
import { Calendar, Clock } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { formatDate } from "@/utils/dateHelpers";

export default function SelectTimeScreen() {
  const router = useRouter();
  const { selectedBarber, selectedService, setSelectedTime } = useBooking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: availability, isLoading } = useQuery({
    queryKey: ["availability", selectedBarber?.id, selectedDate.toISOString().split("T")[0]],
    queryFn: () => api.availability.list({
      barberId: selectedBarber?.id,
      date: selectedDate.toISOString().split("T")[0],
    }),
    enabled: !!selectedBarber,
  });

  const handleContinue = () => {
    if (selectedSlot) {
      setSelectedTime(selectedSlot);
      router.push("/booking/details");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
        
        const isAvailable = !availability?.blocks?.some((block: any) => {
          const blockStart = new Date(block.startISO);
          const blockEnd = new Date(block.endISO);
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minute, 0, 0);
          return slotTime >= blockStart && slotTime < blockEnd;
        });

        slots.push({
          time,
          displayTime,
          isAvailable,
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
          <ActivityIndicator size="large" color={brandColors.primary} />
        ) : (
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  !slot.isAvailable && styles.unavailableSlot,
                  selectedSlot === slot.time && styles.selectedSlot,
                ]}
                onPress={() => slot.isAvailable && setSelectedSlot(slot.time)}
                disabled={!slot.isAvailable}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    !slot.isAvailable && styles.unavailableText,
                    selectedSlot === slot.time && styles.selectedSlotText,
                  ]}
                >
                  {slot.displayTime}
                </Text>
              </TouchableOpacity>
            ))}
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
  unavailableSlot: {
    backgroundColor: "#f5f5f5",
    borderColor: "#f0f0f0",
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
  unavailableText: {
    color: "#ccc",
  },
  selectedSlotText: {
    color: "#fff",
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