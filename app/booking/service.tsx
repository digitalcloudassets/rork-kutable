import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Clock, DollarSign } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useBooking } from "@/providers/BookingProvider";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import type { Service } from "@/types/models";

export default function SelectServiceScreen() {
  const router = useRouter();
  const { barberId, serviceId } = useLocalSearchParams();
  const { selectedBarber, setSelectedBarber, setSelectedService } = useBooking();

  // Fetch barber data if not already selected or if different barber
  const { data: barber, isLoading } = useQuery({
    queryKey: ["barber", barberId],
    queryFn: () => api.barbers.profile({ barberId: barberId as string }),
    enabled: !!barberId && (!selectedBarber || selectedBarber.id !== barberId),
  });

  // Set barber data when loaded
  useEffect(() => {
    if (barber && (!selectedBarber || selectedBarber.id !== barberId)) {
      setSelectedBarber(barber);
    }
  }, [barber, selectedBarber, barberId, setSelectedBarber]);

  // Auto-select service and navigate if serviceId is provided
  useEffect(() => {
    if (serviceId && (selectedBarber || barber)) {
      const currentBarber = selectedBarber || barber;
      const service = currentBarber?.services.find((s: Service) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        router.replace("/booking/time");
      }
    }
  }, [serviceId, selectedBarber, barber, setSelectedService, router]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    router.push("/booking/time");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  const currentBarber = selectedBarber || barber;
  
  if (!currentBarber) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Barber not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select a Service</Text>
        <Text style={styles.headerSubtitle}>with {currentBarber.name}</Text>
      </View>

      <View style={styles.servicesList}>
        {currentBarber.services.map((service: Service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => handleSelectService(service)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description && (
                <Text style={styles.serviceDescription}>{service.description}</Text>
              )}
              <View style={styles.serviceMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.metaText}>{service.durationMinutes} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <DollarSign size={14} color="#666" />
                  <Text style={styles.metaText}>
                    ${(service.priceCents / 100).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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