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
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import type { Service } from "@/types/models";

export default function SelectServiceScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const { setSelectedBarber, setSelectedService } = useBooking();

  const { data: barberData, isLoading: isLoadingBarber } = useQuery({
    queryKey: ["barber", barberId],
    queryFn: () => api.barbers.profile({ barberId: barberId! }),
    enabled: !!barberId,
  });

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", barberId],
    queryFn: () => api.services.list({ barberId: barberId! }),
    enabled: !!barberId,
  });

  const handleServiceSelect = (service: Service) => {
    if (barberData?.barber) {
      setSelectedBarber(barberData.barber);
    }
    setSelectedService(service);
    router.push("/booking/time");
  };

  const isLoading = isLoadingBarber || isLoadingServices;
  const services = servicesData?.services || [];
  const barber = barberData?.barber;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (!barber) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Barber not found</Text>
        <Text style={styles.errorText}>Please try again</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 32,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  servicesList: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
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
    color: "#666",
    marginLeft: 6,
  },
});