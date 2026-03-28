import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  Calendar,
  Heart,
  Clock,
  Star,
  TrendingUp,
  Gift,
  ChevronRight,
  MapPin,
  Scissors,
  User,
  CreditCard,
  Award,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";
import type { Booking, Barber } from "@/types/models";
import { formatDate, formatTime } from "@/utils/dateHelpers";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

const { width } = Dimensions.get("window");

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  backgroundColor?: string;
  testId?: string;
}

function DashboardCard({ title, subtitle, icon, onPress, backgroundColor, testId }: DashboardCardProps) {
  return (
    <TouchableOpacity
      style={[styles.dashboardCard, backgroundColor && { backgroundColor }]}
      onPress={onPress}
      testID={testId}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          {icon}
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
        <ChevronRight size={20} color={Tokens.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: `${color}15` }]}>
        {React.cloneElement(icon as React.ReactElement, { color: color, size: 20 } as any)}
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );
}

interface UpcomingBookingCardProps {
  booking: Booking;
  onPress: () => void;
}

function UpcomingBookingCard({ booking, onPress }: UpcomingBookingCardProps) {
  return (
    <TouchableOpacity style={styles.upcomingCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.upcomingHeader}>
        <View style={styles.upcomingDate}>
          <Text style={styles.upcomingDateText}>{formatDate(booking.startISO)}</Text>
          <Text style={styles.upcomingTimeText}>{formatTime(booking.startISO)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: Tokens.success }]}>
          <Text style={styles.statusText}>Confirmed</Text>
        </View>
      </View>
      <Text style={styles.upcomingService}>{booking.serviceName}</Text>
      <View style={styles.upcomingBarber}>
        <User size={14} color={Tokens.textMuted} />
        <Text style={styles.upcomingBarberName}>{booking.barberName}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface FavoriteBarberCardProps {
  barber: Barber;
  onPress: () => void;
}

function FavoriteBarberCard({ barber, onPress }: FavoriteBarberCardProps) {
  return (
    <TouchableOpacity style={styles.favoriteCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: barber.photoUrl }} style={styles.favoritePhoto} />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{barber.name}</Text>
        <View style={styles.favoriteRating}>
          <Star size={12} color="#FFB800" fill="#FFB800" />
          <Text style={styles.favoriteRatingText}>{barber.rating?.toFixed(1) || '4.8'}</Text>
        </View>
        <View style={styles.favoriteLocation}>
          <MapPin size={12} color={Tokens.textMuted} />
          <Text style={styles.favoriteLocationText} numberOfLines={1}>
            {barber.shopAddress || "Mobile Service"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ClientDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useQuery({
    queryKey: ["client-bookings", user?.id],
    queryFn: () => apiClient.bookings.list({ userId: user?.id }),
    enabled: !!user,
    retry: 2,
  });

  const { data: favoriteBarbers, isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ["favorite-barbers", user?.id],
    queryFn: () => apiClient.barbers.search({}), // Mock favorites for now
    enabled: !!user,
    retry: 2,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings(), refetchFavorites()]);
    setRefreshing(false);
  };

  const now = new Date();
  const upcomingBookings = bookings?.filter((b: Booking) => 
    new Date(b.startISO) >= now && (b.status === "confirmed" || b.status === "pending")
  ) || [];
  
  const completedBookings = bookings?.filter((b: Booking) => 
    b.status === "completed"
  ) || [];

  // Mock total spent calculation - in real app this would come from payment records
  const totalSpent = completedBookings.length * 45; // Average $45 per appointment
  const loyaltyPoints = Math.floor(totalSpent * 10); // 10 points per dollar spent

  const nextBooking = upcomingBookings[0];

  const dashboardItems = [
    {
      title: "Favorite Barbers",
      subtitle: `${favoriteBarbers?.length || 0} saved`,
      icon: <Heart size={24} color={Tokens.accent} />,
      onPress: () => router.push("/(tabs)/client-dashboard/favorites" as any),
      testId: "dashboard-favorites",
    },
    {
      title: "Booking History",
      subtitle: `${completedBookings.length} appointments`,
      icon: <Clock size={24} color={Tokens.accent} />,
      onPress: () => router.push("/(tabs)/client-dashboard/history" as any),
      testId: "dashboard-history",
    },
    {
      title: "Rewards & Loyalty",
      subtitle: `${loyaltyPoints} points earned`,
      icon: <Gift size={24} color={Tokens.accent} />,
      onPress: () => router.push("/(tabs)/client-dashboard/rewards" as any),
      testId: "dashboard-rewards",
    },
  ];

  const stats = [
    {
      title: "Total Bookings",
      value: bookings?.length?.toString() || "0",
      icon: <Calendar />,
      color: Tokens.accent,
    },
    {
      title: "Total Spent",
      value: `$${totalSpent.toFixed(0)}`,
      icon: <CreditCard />,
      color: "#10B981",
    },
    {
      title: "Loyalty Points",
      value: loyaltyPoints.toString(),
      icon: <Award />,
      color: "#8B5CF6",
    },
  ];

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon={User}
          title="Sign in required"
          description="Please sign in to view your dashboard and manage your bookings."
          actionLabel="Sign In"
          onAction={() => router.push("/auth/welcome")}
          testID="dashboard-signin-required"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user.name}!</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </View>

        {/* Next Appointment */}
        {nextBooking && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            <UpcomingBookingCard
              booking={nextBooking}
              onPress={() => router.push(`/account/booking/${nextBooking.id}`)}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.dashboardGrid}>
            {dashboardItems.map((item, index) => (
              <DashboardCard
                key={index}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                onPress={item.onPress}
                testId={item.testId}
              />
            ))}
          </View>
        </View>

        {/* Favorite Barbers */}
        {favoriteBarbers && favoriteBarbers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Favorite Barbers</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/client-dashboard/favorites" as any)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesScroll}
            >
              {favoriteBarbers.slice(0, 5).map((barber: Barber) => (
                <FavoriteBarberCard
                  key={barber.id}
                  barber={barber}
                  onPress={() => router.push(`/barber/${barber.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Activity */}
        {upcomingBookings.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/bookings")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingBookings.slice(1, 4).map((booking: Booking) => (
              <UpcomingBookingCard
                key={booking.id}
                booking={booking}
                onPress={() => router.push(`/account/booking/${booking.id}`)}
              />
            ))}
          </View>
        )}

        {/* Empty State for New Users */}
        {(!bookings || bookings.length === 0) && !bookingsLoading && (
          <View style={styles.emptySection}>
            <EmptyState
              icon={Scissors}
              title="Start Your Grooming Journey"
              description="Book your first appointment to unlock personalized recommendations and track your grooming history."
              actionLabel="Find Barbers"
              onAction={() => router.push("/(tabs)" as any)}
              testID="dashboard-empty-state"
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: Tokens.textMuted,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "700",
    color: Tokens.text,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Tokens.text,
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 12,
    color: Tokens.textMuted,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Tokens.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Tokens.accent,
    fontWeight: "600",
  },
  dashboardGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dashboardCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Tokens.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  upcomingCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  upcomingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  upcomingDate: {
    flex: 1,
  },
  upcomingDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 2,
  },
  upcomingTimeText: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  upcomingService: {
    fontSize: 16,
    fontWeight: "500",
    color: Tokens.text,
    marginBottom: 8,
  },
  upcomingBarber: {
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingBarberName: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginLeft: 6,
  },
  favoritesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  favoriteCard: {
    width: 140,
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  favoritePhoto: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: Tokens.border,
    marginBottom: 8,
  },
  favoriteInfo: {
    gap: 4,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.text,
  },
  favoriteRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteRatingText: {
    fontSize: 12,
    color: Tokens.textMuted,
    marginLeft: 4,
    fontWeight: "500",
  },
  favoriteLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteLocationText: {
    fontSize: 11,
    color: Tokens.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  emptySection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
});