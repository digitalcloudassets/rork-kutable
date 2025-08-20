import React, { useState, useMemo } from "react";
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
  FlatList,
} from "react-native";
import { Search, MapPin, Star, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import type { Barber, Service } from "@/types/models";
import { seedData } from "@/lib/seedData";

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: barbers, isLoading, refetch } = useQuery({
    queryKey: ["barbers", searchQuery, selectedServiceId],
    queryFn: () => api.barbers.search({ q: searchQuery || undefined, serviceId: selectedServiceId }),
  });

  // Get all unique services for filter chips
  const allServices = useMemo(() => {
    const serviceMap = new Map<string, Service>();
    seedData.barbers.forEach(barber => {
      barber.services.forEach(service => {
        if (service.active && !serviceMap.has(service.id)) {
          serviceMap.set(service.id, service);
        }
      });
    });
    return Array.from(serviceMap.values());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBarberPress = (barberId: string) => {
    router.push(`/barber/${barberId}`);
  };

  const handleServiceFilter = (serviceId: string) => {
    setSelectedServiceId(selectedServiceId === serviceId ? undefined : serviceId);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedServiceId(undefined);
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedServiceId;

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
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <X size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Service Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {allServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.filterChip,
                selectedServiceId === service.id && styles.filterChipActive
              ]}
              onPress={() => handleServiceFilter(service.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedServiceId === service.id && styles.filterChipTextActive
              ]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} style={styles.loader} />
        </View>
      ) : barbers && barbers.length > 0 ? (
        <FlatList
          data={barbers}
          keyExtractor={(item) => item.id}
          renderItem={({ item: barber }) => (
            <TouchableOpacity
              style={styles.barberCard}
              onPress={() => handleBarberPress(barber.id)}
              activeOpacity={0.9}
              testID={`barber-card-${barber.id}`}
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
                    <Text style={styles.ratingText}>{barber.rating || 4.8}</Text>
                  </View>
                </View>
                <View style={styles.servicesPreview}>
                  {barber.services.slice(0, 2).map((service: Service, idx: number) => (
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
          )}
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>Featured Barbers</Text>
          )}
          contentContainerStyle={styles.barbersGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.emptyState}>
            <Search size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No barbers found</Text>
            <Text style={styles.emptyStateText}>
              {hasActiveFilters 
                ? "Try adjusting your search or filters" 
                : "No barbers available at the moment"}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
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
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: brandColors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    flex: 1,
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
    marginTop: 20,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  clearFiltersButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFiltersButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});