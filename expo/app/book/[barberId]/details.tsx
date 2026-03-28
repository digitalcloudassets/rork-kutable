import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useBooking } from "@/providers/BookingProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const { user } = useAuth();
  const { selectedBarber, selectedService, selectedTime, setClientDetails } = useBooking();
  
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [note, setNote] = useState("");

  const handleContinue = () => {
    setClientDetails({ name, phone, email, note });
    router.push(`/book/${barberId}/payment`);
  };

  const isValid = name.trim() && phone.trim();

  return (
    <Screen>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Details</Text>
          <Text style={styles.headerSubtitle}>Almost there! Just a few details needed.</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{selectedService?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Barber:</Text>
            <Text style={styles.summaryValue}>{selectedBarber?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time:</Text>
            <Text style={styles.summaryValue}>
              {selectedTime ? 
                new Date(selectedTime.startISO).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric'
                }) + ' at ' + 
                new Date(selectedTime.startISO).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
                : 'Not selected'
              }
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{selectedService?.durationMinutes} min</Text>
          </View>
          <View style={[styles.summaryRow, styles.priceRow]}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.priceValue}>
              ${((selectedService?.priceCents || 0) / 100).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Requests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Any special requests or notes for your barber"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
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
  summaryCard: {
    backgroundColor: Tokens.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Tokens.text,
  },
  priceRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Tokens.border,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Tokens.accent,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Tokens.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Tokens.surface,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Tokens.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
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