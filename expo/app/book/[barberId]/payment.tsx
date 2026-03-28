import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CreditCard, Lock, Check } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { apiClient } from "@/lib/api";

export default function PaymentScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const { selectedBarber, selectedService, selectedTime, clientDetails, clearBooking } = useBooking();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const createBookingMutation = useMutation({
    mutationFn: apiClient.bookings.create,
    onSuccess: (booking) => {
      processPayment(booking.id);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create booking. Please try again.");
      setIsProcessing(false);
    },
  });

  const processPayment = async (bookingId: string) => {
    try {
      await apiClient.payments.createIntent({ bookingId });
      
      setTimeout(() => {
        setIsProcessing(false);
        clearBooking();
        router.replace(`/book/${barberId}/confirmation`);
      }, 2000);
    } catch {
      Alert.alert("Payment Error", "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    
    createBookingMutation.mutate({
      barberId: selectedBarber?.id,
      serviceId: selectedService?.id,
      startISO: selectedTime?.startISO,
      clientName: clientDetails?.name,
      clientPhone: clientDetails?.phone,
      clientUserId: user?.id,
      note: clientDetails?.note,
    });
  };

  const totalAmount = (selectedService?.priceCents || 0) / 100;

  return (
    <Screen>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.secureRow}>
          <Lock size={14} color={Tokens.success} />
          <Text style={styles.secureText}>Secure Payment via Stripe</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{selectedService?.name}</Text>
          <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.paymentMethodCard}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        
        <TouchableOpacity style={styles.paymentOption}>
          <View style={styles.paymentOptionLeft}>
            <CreditCard size={20} color={Tokens.text} />
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
              <Text style={styles.paymentMethodDesc}>Powered by Stripe</Text>
            </View>
          </View>
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Payment Protection</Text>
        <View style={styles.infoRow}>
          <Check size={16} color={Tokens.success} />
          <Text style={styles.infoText}>Your payment is secure and encrypted</Text>
        </View>
        <View style={styles.infoRow}>
          <Check size={16} color={Tokens.success} />
          <Text style={styles.infoText}>Free cancellation up to 24 hours before</Text>
        </View>
        <View style={styles.infoRow}>
          <Check size={16} color={Tokens.success} />
          <Text style={styles.infoText}>Instant confirmation after payment</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.disabledButton]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ${totalAmount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          By completing this payment, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 8,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  secureText: {
    fontSize: 13,
    color: Tokens.success,
    marginLeft: 6,
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
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
  divider: {
    height: 1,
    backgroundColor: Tokens.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Tokens.accent,
  },
  paymentMethodCard: {
    backgroundColor: Tokens.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentDetails: {
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: "500",
    color: Tokens.text,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: Tokens.textMuted,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Tokens.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Tokens.accent,
  },
  infoCard: {
    backgroundColor: Tokens.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Tokens.success + '40',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.success,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Tokens.text,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
  },
  payButton: {
    backgroundColor: Tokens.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: Tokens.textMuted,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  disclaimer: {
    fontSize: 12,
    color: Tokens.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});