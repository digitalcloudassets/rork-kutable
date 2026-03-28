import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import {
  Calendar,
  Scissors,
  DollarSign,
  BarChart3,
  Settings,
  ChevronRight,
  CreditCard,
  AlertCircle,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import { Tokens } from "@/theme/tokens";
import { ScrollScreen } from "@/components/Screen";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";

interface ManageCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  testId?: string;
}

function ManageCard({ title, description, icon, onPress, testId }: ManageCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={testId}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <ChevronRight size={20} color={Tokens.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function StripeBanner() {
  const { user } = useAuth();
  
  const { data: accountStatus, isLoading } = useQuery({
    queryKey: ["stripe-status", user?.id],
    queryFn: () => apiClient.stripe.getAccountStatus({ barberId: user?.id || "" }),
    enabled: !!user,
  });

  const isConnected = accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled;
  
  // Don't show banner if loading or already connected
  if (isLoading || isConnected) {
    return null;
  }

  const handleConnectStripe = () => {
    router.push("/(tabs)/dashboard/onboarding");
  };

  return (
    <TouchableOpacity
      style={styles.stripeBanner}
      onPress={handleConnectStripe}
      activeOpacity={0.8}
    >
      <View style={styles.stripeBannerContent}>
        <View style={styles.stripeBannerIcon}>
          <AlertCircle size={20} color={Tokens.warning} />
        </View>
        <View style={styles.stripeBannerText}>
          <Text style={styles.stripeBannerTitle}>Connect Stripe to Accept Payments</Text>
          <Text style={styles.stripeBannerSubtitle}>
            Set up your Stripe account to start receiving payments from clients
          </Text>
        </View>
        <ChevronRight size={20} color={Tokens.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ManageScreen() {
  const manageOptions = [
    {
      title: "Calendar & Availability",
      description: "Manage your schedule and availability",
      icon: <Calendar size={24} color={Tokens.accent} />,
      route: "/(tabs)/dashboard/calendar",
      testId: "manage-calendar-button",
    },
    {
      title: "Services",
      description: "Edit your services and pricing",
      icon: <Scissors size={24} color={Tokens.accent} />,
      route: "/(tabs)/dashboard/services",
      testId: "manage-services-button",
    },
    {
      title: "Earnings",
      description: "View your earnings and payouts",
      icon: <DollarSign size={24} color={Tokens.accent} />,
      route: "/(tabs)/dashboard/earnings",
      testId: "manage-earnings-button",
    },
    {
      title: "Analytics",
      description: "Track your business performance",
      icon: <BarChart3 size={24} color={Tokens.accent} />,
      route: "/(tabs)/dashboard/analytics",
      testId: "manage-analytics-button",
    },
    {
      title: "Settings",
      description: "Account and app preferences",
      icon: <Settings size={24} color={Tokens.accent} />,
      route: "/(tabs)/profile",
      testId: "manage-settings-button",
    },
  ];

  const handleNavigation = (route: string) => {
    console.log(`Navigating to: ${route}`);
    router.push(route as any);
  };

  return (
    <ScrollScreen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Your Business</Text>
          <Text style={styles.headerSubtitle}>
            Quick access to all your business tools
          </Text>
        </View>

        <StripeBanner />

        <View style={styles.cardsContainer}>
          {manageOptions.map((option, index) => (
            <ManageCard
              key={index}
              title={option.title}
              description={option.description}
              icon={option.icon}
              onPress={() => handleNavigation(option.route)}
              testId={option.testId}
            />
          ))}
        </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Tokens.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Tokens.textMuted,
    lineHeight: 22,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Tokens.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
    lineHeight: 20,
  },
  stripeBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: `${Tokens.warning}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Tokens.warning}30`,
    padding: 16,
  },
  stripeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Tokens.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stripeBannerText: {
    flex: 1,
  },
  stripeBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: 2,
  },
  stripeBannerSubtitle: {
    fontSize: 13,
    color: Tokens.textMuted,
    lineHeight: 18,
  },
});