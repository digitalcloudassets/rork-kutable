import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock, DollarSign } from "lucide-react-native";
import { useBooking } from "@/providers/BookingProvider";
import { brandColors } from "@/config/brand";
import type { Service } from "@/types/models";

export default function SelectServiceScreen() {
  const router = useRouter();
  const { selectedBarber, setSelectedService } = useBooking();

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    router.push("/booking/time");
  };

  if (!selectedBarber) {
    return (
      <View style={styles.container}>
        <Text>Please select a barber first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select a Service</Text>
        <Text style={styles.headerSubtitle}>with {selectedBarber.name}</Text>
      </View>

      <View style={styles.servicesList}>
        {selectedBarber.services.map((service: Service) => (
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