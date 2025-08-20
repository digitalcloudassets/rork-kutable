import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Clock, DollarSign, AlertCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { api } from "@/lib/api";
import type { Service } from "@/types/models";

export default function SelectServiceScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const { setSelectedBarber, setSelectedService } = useBooking();

  const { data: barberData, isLoading } = useQuery({
    queryKey: ["barber", barberId],
    queryFn: () => api.barbers.profile({ barberId: barberId! }),
    enabled: !!barberId,
  });

  const handleServiceSelect = (service: Service) => {
    if (barberData) {
      setSelectedBarber(barberData);
    }
    setSelectedService(service);
    router.push(`/book/${barberId}/time`);
  };

  const services = barberData?.services || [];
  const barber = barberData;

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Tokens.accent} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </Screen>
    );
  }

  if (!barber) {
    return (
      <Screen style={styles.errorContainer}>
        <AlertCircle size={48} color={Tokens.error} />
        <Text style={styles.errorTitle}>Barber not found</Text>
        <Text style={styles.errorText}>Please try again</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select a Service</Text>
        <Text style={styles.headerSubtitle}>Book with {barber.name}</Text>
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No services available</Text>
          <Text style={styles.emptyText}>This barber hasn&apos;t added any services yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.servicesList}>
          {services.map((service: Service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServiceSelect(service)}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  <View style={styles.metaItem}>
                    <DollarSign size={16} color="#666" />
                    <Text style={styles.metaText}>
                      ${(service.priceCents / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.metaText}>{service.durationMinutes} min</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Tokens.textMuted,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  servicesList: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginLeft: 6,
  },
});