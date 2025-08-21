import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import {
  Gift,
  Award,
  Star,
  Crown,
  Zap,
  Calendar,
  TrendingUp,
  ChevronRight,
  Coffee,
  Scissors,
  Sparkles,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Tokens } from "@/theme/tokens";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";

const { width } = Dimensions.get("window");

interface RewardCardProps {
  title: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  available: boolean;
  onRedeem: () => void;
}

function RewardCard({ title, description, points, icon, available, onRedeem }: RewardCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.rewardCard, !available && styles.rewardCardDisabled]} 
      onPress={available ? onRedeem : undefined}
      activeOpacity={available ? 0.8 : 1}
    >
      <View style={styles.rewardIcon}>
        {icon}
      </View>
      <View style={styles.rewardContent}>
        <Text style={[styles.rewardTitle, !available && styles.rewardTitleDisabled]}>
          {title}
        </Text>
        <Text style={[styles.rewardDescription, !available && styles.rewardDescriptionDisabled]}>
          {description}
        </Text>
        <View style={styles.rewardFooter}>
          <Text style={[styles.rewardPoints, !available && styles.rewardPointsDisabled]}>
            {points} points
          </Text>
          {available && <ChevronRight size={16} color={Tokens.accent} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface TierCardProps {
  name: string;
  description: string;
  pointsRequired: number;
  currentPoints: number;
  benefits: string[];
  isCurrentTier: boolean;
  isUnlocked: boolean;
}

function TierCard({ name, description, pointsRequired, currentPoints, benefits, isCurrentTier, isUnlocked }: TierCardProps) {
  const progress = Math.min((currentPoints / pointsRequired) * 100, 100);
  
  return (
    <View style={[styles.tierCard, isCurrentTier && styles.currentTierCard]}>
      <View style={styles.tierHeader}>
        <View style={styles.tierInfo}>
          <Text style={[styles.tierName, isCurrentTier && styles.currentTierName]}>
            {name}
          </Text>
          <Text style={styles.tierDescription}>{description}</Text>
        </View>
        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Crown size={16} color="#fff" />
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>
      
      {!isUnlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentPoints} / {pointsRequired} points
          </Text>
        </View>
      )}
      
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <Sparkles size={12} color={isCurrentTier ? Tokens.accent : Tokens.textMuted} />
            <Text style={[styles.benefitText, isCurrentTier && styles.currentBenefitText]}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real app this would come from API
  const { data: bookings, refetch } = useQuery({
    queryKey: ["client-bookings", user?.id],
    queryFn: () => apiClient.bookings.list({ userId: user?.id }),
    enabled: !!user,
  });

  const completedBookings = bookings?.filter((b: any) => b.status === "completed") || [];
  const totalSpent = completedBookings.length * 45; // Mock calculation
  const loyaltyPoints = Math.floor(totalSpent * 10);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rewards = [
    {
      title: "Free Coffee",
      description: "Complimentary coffee during your next visit",
      points: 100,
      icon: <Coffee size={24} color={Tokens.accent} />,
      available: loyaltyPoints >= 100,
    },
    {
      title: "10% Off Next Service",
      description: "Save 10% on any service of your choice",
      points: 250,
      icon: <Scissors size={24} color={Tokens.accent} />,
      available: loyaltyPoints >= 250,
    },
    {
      title: "Premium Styling",
      description: "Upgrade to premium styling products",
      points: 500,
      icon: <Sparkles size={24} color={Tokens.accent} />,
      available: loyaltyPoints >= 500,
    },
    {
      title: "VIP Treatment",
      description: "Skip the line and get priority booking",
      points: 1000,
      icon: <Crown size={24} color={Tokens.accent} />,
      available: loyaltyPoints >= 1000,
    },
  ];

  const tiers = [
    {
      name: "Bronze",
      description: "Welcome to Kutable rewards",
      pointsRequired: 0,
      benefits: ["Earn 1 point per $1 spent", "Birthday discount"],
      isCurrentTier: loyaltyPoints < 500,
      isUnlocked: true,
    },
    {
      name: "Silver",
      description: "Regular customer perks",
      pointsRequired: 500,
      benefits: ["Earn 1.5 points per $1 spent", "Priority booking", "Exclusive offers"],
      isCurrentTier: loyaltyPoints >= 500 && loyaltyPoints < 1500,
      isUnlocked: loyaltyPoints >= 500,
    },
    {
      name: "Gold",
      description: "Premium member benefits",
      pointsRequired: 1500,
      benefits: ["Earn 2 points per $1 spent", "Free upgrades", "VIP support", "Early access"],
      isCurrentTier: loyaltyPoints >= 1500,
      isUnlocked: loyaltyPoints >= 1500,
    },
  ];

  const handleRedeemReward = (reward: any) => {
    console.log("Redeeming reward:", reward.title);
    // In real app, this would call API to redeem reward
  };

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon={Gift}
          title="Sign in required"
          description="Please sign in to view your rewards and loyalty status."
          actionLabel="Sign In"
          onAction={() => router.push("/auth/welcome")}
          testID="rewards-signin-required"
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
        {/* Points Summary */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <View style={styles.pointsIcon}>
              <Star size={32} color="#FFB800" fill="#FFB800" />
            </View>
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsValue}>{loyaltyPoints}</Text>
              <Text style={styles.pointsLabel}>Loyalty Points</Text>
            </View>
          </View>
          <Text style={styles.pointsSubtext}>
            Earned from {completedBookings.length} completed appointments
          </Text>
        </View>

        {/* Membership Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Tiers</Text>
          <Text style={styles.sectionSubtitle}>
            Unlock better rewards as you visit more often
          </Text>
          {tiers.map((tier, index) => (
            <TierCard
              key={index}
              name={tier.name}
              description={tier.description}
              pointsRequired={tier.pointsRequired}
              currentPoints={loyaltyPoints}
              benefits={tier.benefits}
              isCurrentTier={tier.isCurrentTier}
              isUnlocked={tier.isUnlocked}
            />
          ))}
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <Text style={styles.sectionSubtitle}>
            Redeem your points for exclusive perks
          </Text>
          {rewards.map((reward, index) => (
            <RewardCard
              key={index}
              title={reward.title}
              description={reward.description}
              points={reward.points}
              icon={reward.icon}
              available={reward.available}
              onRedeem={() => handleRedeemReward(reward)}
            />
          ))}
        </View>

        {/* How to Earn More */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn More Points</Text>
          <View style={styles.earnCard}>
            <View style={styles.earnItem}>
              <Calendar size={20} color={Tokens.accent} />
              <Text style={styles.earnText}>Book appointments regularly</Text>
            </View>
            <View style={styles.earnItem}>
              <Star size={20} color={Tokens.accent} />
              <Text style={styles.earnText}>Leave reviews after visits</Text>
            </View>
            <View style={styles.earnItem}>
              <TrendingUp size={20} color={Tokens.accent} />
              <Text style={styles.earnText}>Refer friends to Kutable</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pointsCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Tokens.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFB80015",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Tokens.text,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    color: Tokens.textMuted,
    fontWeight: "500",
  },
  pointsSubtext: {
    fontSize: 14,
    color: Tokens.textMuted,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Tokens.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  tierCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  currentTierCard: {
    borderColor: Tokens.accent,
    backgroundColor: `${Tokens.accent}05`,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 4,
  },
  currentTierName: {
    color: Tokens.accent,
  },
  tierDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Tokens.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: Tokens.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Tokens.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Tokens.textMuted,
    textAlign: "center",
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginLeft: 8,
  },
  currentBenefitText: {
    color: Tokens.text,
  },
  rewardCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
    flexDirection: "row",
    alignItems: "center",
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Tokens.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 4,
  },
  rewardTitleDisabled: {
    color: Tokens.textMuted,
  },
  rewardDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 8,
  },
  rewardDescriptionDisabled: {
    color: Tokens.textMuted,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.accent,
  },
  rewardPointsDisabled: {
    color: Tokens.textMuted,
  },
  earnCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  earnItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  earnText: {
    fontSize: 16,
    color: Tokens.text,
    marginLeft: 12,
    flex: 1,
  },
});