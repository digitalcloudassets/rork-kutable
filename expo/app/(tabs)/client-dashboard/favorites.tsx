import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from "react-native";
import {
  Heart,
  Search,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  HeartOff,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";
import type { Barber } from "@/types/models";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

interface FavoriteBarberCardProps {
  barber: Barber;
  onPress: () => void;
  onRemove: () => void;
}

function FavoriteBarberCard({ barber, onPress, onRemove }: FavoriteBarberCardProps) {
  return (
    <TouchableOpacity style={styles.barberCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: barber.photoUrl }} style={styles.barberPhoto} />
      <View style={styles.barberInfo}>
        <View style={styles.barberHeader}>
          <Text style={styles.barberName}>{barber.name}</Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Heart size={20} color={Tokens.accent} fill={Tokens.accent} />
          </TouchableOpacity>
        </View>
        {barber.shopName && (
          <Text style={styles.shopName}>{barber.shopName}</Text>
        )}
        <View style={styles.barberMeta}>
          <View style={styles.locationRow}>
            <MapPin size={14} color={Tokens.textMuted} />
            <Text style={styles.locationText}>
              {barber.shopAddress || "Mobile Service"}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>
              {barber.rating?.toFixed(1) || '4.8'} ({barber.reviewCount || 0})
            </Text>
          </View>
        </View>
        <View style={styles.servicesPreview}>
          {barber.services.slice(0, 3).map((service, idx) => (
            <View key={idx} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{service.name}</Text>
            </View>
          ))}
          {barber.services.length > 3 && (
            <View style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>+{barber.services.length - 3}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Phone size={16} color={Tokens.accent} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <MessageCircle size={16} color={Tokens.accent} />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FavoriteBarbersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock favorites query - in real app this would fetch user's actual favorites
  const { data: favoriteBarbers, isLoading, error, refetch } = useQuery({
    queryKey: ["favorite-barbers", user?.id],
    queryFn: () => apiClient.barbers.search({}),
    enabled: !!user,
    retry: 2,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (barberId: string) => {
      // Mock remove favorite - in real app this would call API
      console.log("Removing favorite:", barberId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-barbers", user?.id] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBarberPress = (barberId: string) => {
    router.push(`/barber/${barberId}`);
  };

  const handleRemoveFavorite = (barberId: string) => {
    removeFavoriteMutation.mutate(barberId);
  };

  const filteredBarbers = favoriteBarbers?.filter((barber: Barber) =>
    barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barber.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon={Heart}
          title="Sign in required"
          description="Please sign in to view your favorite barbers."
          actionLabel="Sign In"
          onAction={() => router.push("/auth/welcome")}
          testID="favorites-signin-required"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Tokens.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your favorite barbers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Tokens.textMuted}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <ErrorState
            title="Unable to load favorites"
            message="Please check your internet connection and try again."
            onRetry={refetch}
            isRetrying={isLoading}
            testID="favorites-error-state"
          />
        ) : filteredBarbers.length > 0 ? (
          <>
            <Text style={styles.resultsText}>
              {filteredBarbers.length} favorite barber{filteredBarbers.length !== 1 ? 's' : ''}
            </Text>
            {filteredBarbers.map((barber: Barber) => (
              <FavoriteBarberCard
                key={barber.id}
                barber={barber}
                onPress={() => handleBarberPress(barber.id)}
                onRemove={() => handleRemoveFavorite(barber.id)}
              />
            ))}
          </>
        ) : (
          <EmptyState
            icon={HeartOff}
            title="No favorite barbers yet"
            description={
              searchQuery
                ? "No barbers match your search. Try adjusting your search terms."
                : "Start exploring and add barbers to your favorites to see them here."
            }
            actionLabel={searchQuery ? "Clear Search" : "Find Barbers"}
            onAction={() => {
              if (searchQuery) {
                setSearchQuery("");
              } else {
                router.push("/(tabs)/index" as any);
              }
            }}
            testID="favorites-empty-state"
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: Tokens.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Tokens.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Tokens.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  barberCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  barberPhoto: {
    width: "100%",
    height: 200,
    backgroundColor: Tokens.border,
  },
  barberInfo: {
    padding: 16,
  },
  barberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  barberName: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  shopName: {
    fontSize: 14,
    color: Tokens.textMuted,
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
    color: Tokens.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: Tokens.textMuted,
    marginLeft: 4,
    fontWeight: "600",
  },
  servicesPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  serviceChip: {
    backgroundColor: `${Tokens.accent}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Tokens.accent}30`,
  },
  serviceChipText: {
    fontSize: 12,
    color: Tokens.accent,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Tokens.accent,
    backgroundColor: `${Tokens.accent}10`,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Tokens.accent,
    marginLeft: 6,
  },
});