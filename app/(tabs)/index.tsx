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
import { Search, MapPin, Star, X, Wifi, WifiOff } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BRAND, brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import type { Barber, Service } from "@/types/models";
import { seedData } from "@/lib/seedData";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: barbers, isLoading, error, refetch } = useQuery({
    queryKey: ["barbers", searchQuery, selectedServiceId],
    queryFn: () => api.barbers.search({ q: searchQuery || undefined, serviceId: selectedServiceId }),
    retry: 2,
    retryDelay: 1000,
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
          <Search size={20} color={BRAND.TEXT_SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search barbers or services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BRAND.TEXT_SECONDARY}
          />
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <X size={18} color={BRAND.TEXT_SECONDARY} />
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

      {error ? (
        <ErrorState
          title="Unable to load barbers"
          message="Please check your internet connection and try again."
          onRetry={refetch}
          isRetrying={isLoading}
          testID="explore-error-state"
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.ACCENT} style={styles.loader} />
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
                    <MapPin size={14} color={BRAND.TEXT_SECONDARY} />
                    <Text style={styles.locationText}>
                      {barber.shopAddress || "Mobile Service"}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>
                      {barber.rating ? barber.rating.toFixed(1) : '4.8'}
                    </Text>
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
          <EmptyState
            icon={Search}
            title="No barbers found"
            description={
              hasActiveFilters 
                ? "Try adjusting your search or filters to find more barbers in your area." 
                : "No barbers are available at the moment. Pull down to refresh or try again later."
            }
            actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
            testID="explore-empty-state"
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BG_DARK,
  },
  searchContainer: {
    backgroundColor: BRAND.SURFACE_DARK,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#202633",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: BRAND.TEXT_PRIMARY,
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
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: BRAND.ACCENT,
  },
  filterChipText: {
    fontSize: 14,
    color: BRAND.TEXT_SECONDARY,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: BRAND.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: BRAND.TEXT_PRIMARY,
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
    backgroundColor: BRAND.SURFACE_DARK,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#202633",
  },
  barberPhoto: {
    width: "100%",
    height: 200,
    backgroundColor: "#1F2937",
  },
  barberInfo: {
    padding: 16,
  },
  barberName: {
    fontSize: 18,
    fontWeight: "600",
    color: BRAND.TEXT_PRIMARY,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 14,
    color: BRAND.TEXT_SECONDARY,
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
    color: BRAND.TEXT_SECONDARY,
    marginLeft: 4,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: BRAND.TEXT_SECONDARY,
    marginLeft: 4,
    fontWeight: "600",
  },
  servicesPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  serviceChip: {
    backgroundColor: "rgba(124, 92, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 255, 0.3)",
  },
  serviceChipText: {
    fontSize: 12,
    color: BRAND.ACCENT,
    fontWeight: "500",
  },
});