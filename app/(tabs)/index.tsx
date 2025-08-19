import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Search, MapPin, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import type { Barber } from "@/types/models";

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: barbers, isLoading, refetch } = useQuery({
    queryKey: ["barbers", searchQuery],
    queryFn: () => api.barbers.list({ search: searchQuery }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBarberPress = (barberId: string) => {
    router.push(`/barber/${barberId}`);
  };

  const filteredBarbers = barbers?.filter((barber: Barber) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      barber.name.toLowerCase().includes(query) ||
      barber.shopName?.toLowerCase().includes(query) ||
      barber.services.some(s => s.name.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search barbers or services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Featured Barbers</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={brandColors.primary} style={styles.loader} />
        ) : (
          <View style={styles.barbersGrid}>
            {filteredBarbers?.map((barber: Barber) => (
              <TouchableOpacity
                key={barber.id}
                style={styles.barberCard}
                onPress={() => handleBarberPress(barber.id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: barber.photoUrl }} style={styles.barberPhoto} />
                <View style={styles.barberInfo}>
                  <Text style={styles.barberName}>{barber.name}</Text>
                  {barber.shopName && (
                    <Text style={styles.shopName}>{barber.shopName}</Text>
                  )}
                  <View style={styles.barberMeta}>
                    <View style={styles.locationRow}>
                      <MapPin size={14} color="#666" />
                      <Text style={styles.locationText}>
                        {barber.shopAddress || "Mobile Service"}
                      </Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Star size={14} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.ratingText}>4.8</Text>
                    </View>
                  </View>
                  <View style={styles.servicesPreview}>
                    {barber.services.slice(0, 2).map((service, idx) => (
                      <View key={idx} style={styles.serviceChip}>
                        <Text style={styles.serviceChipText}>{service.name}</Text>
                      </View>
                    ))}
                    {barber.services.length > 2 && (
                      <View style={styles.serviceChip}>
                        <Text style={styles.serviceChipText}>+{barber.services.length - 2}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  loader: {
    marginTop: 50,
  },
  barbersGrid: {
    paddingHorizontal: 16,
  },
  barberCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  barberPhoto: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  barberInfo: {
    padding: 16,
  },
  barberName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  shopName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  barberMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  servicesPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  serviceChip: {
    backgroundColor: brandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceChipText: {
    fontSize: 12,
    color: brandColors.primary,
    fontWeight: "500",
  },
});