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
import { useRouter } from "expo-router";
import { CreditCard, Lock, Check } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";

export default function PaymentScreen() {
  const router = useRouter();
  const { selectedBarber, selectedService, selectedTime, clientDetails, clearBooking } = useBooking();
  const [isProcessing, setIsProcessing] = useState(false);

  const createBookingMutation = useMutation({
    mutationFn: api.bookings.create,
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
      const paymentIntent = await api.payments.createIntent({ bookingId });
      
      setTimeout(() => {
        setIsProcessing(false);
        clearBooking();
        router.replace("/booking/confirmation");
      }, 2000);
    } catch (error) {
      Alert.alert("Payment Error", "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    
    createBookingMutation.mutate({
      barberId: selectedBarber?.id,
      serviceId: selectedService?.id,
      startISO: selectedTime,
      clientName: clientDetails?.name,
      clientPhone: clientDetails?.phone,
      note: clientDetails?.note,
    });
  };

  const totalAmount = (selectedService?.priceCents || 0) / 100;
  const platformFee = totalAmount * 0.029 + 0.30;
  const barberEarnings = totalAmount - platformFee;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.secureRow}>
          <Lock size={14} color="#10B981" />
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
            <CreditCard size={20} color="#333" />
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
          <Check size={16} color="#10B981" />
          <Text style={styles.infoText}>Your payment is secure and encrypted</Text>
        </View>
        <View style={styles.infoRow}>
          <Check size={16} color="#10B981" />
          <Text style={styles.infoText}>Free cancellation up to 24 hours before</Text>
        </View>
        <View style={styles.infoRow}>
          <Check size={16} color="#10B981" />
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
    marginBottom: 8,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  secureText: {
    fontSize: 13,
    color: "#10B981",
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: brandColors.primary,
  },
  paymentMethodCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    color: "#333",
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: brandColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brandColors.primary,
  },
  infoCard: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#065F46",
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
  },
  payButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  disclaimer: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
});