import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { CreditCard, ExternalLink, CheckCircle, AlertCircle } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { useMutation, useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const { data: accountStatus, isLoading: statusLoading, refetch } = useQuery({
    queryKey: ["stripe-status", user?.id],
    queryFn: () => api.stripe.getAccountStatus({ barberId: user?.id || "" }),
    enabled: !!user,
  });

  const createAccountMutation = useMutation({
    mutationFn: api.stripe.createOrFetchAccount,
    onSuccess: async (data) => {
      console.log("Account created/fetched:", data.accountId);
      await handleAccountLink(data.accountId);
    },
    onError: (error) => {
      console.error("Error creating account:", error);
      Alert.alert("Error", "Failed to create Stripe account. Please try again.");
      setIsConnecting(false);
    },
  });

  const accountLinkMutation = useMutation({
    mutationFn: api.stripe.createAccountLink,
    onSuccess: async (data) => {
      console.log("Opening account link:", data.url);
      try {
        const result = await WebBrowser.openBrowserAsync(data.url);
        console.log("Browser result:", result);
        
        // Start polling for account status after user returns
        setIsConnecting(false);
        startPolling();
      } catch (error) {
        console.error("Error opening browser:", error);
        Alert.alert("Error", "Failed to open Stripe onboarding. Please try again.");
        setIsConnecting(false);
      }
    },
    onError: (error) => {
      console.error("Error creating account link:", error);
      Alert.alert("Error", "Failed to create onboarding link. Please try again.");
      setIsConnecting(false);
    },
  });

  const handleAccountLink = async (accountId: string) => {
    // Use environment variable or fallback URLs
    const baseUrl = process.env.EXPO_PUBLIC_APP_BASE_URL || "exp://localhost:8081";
    const refreshUrl = `${baseUrl}/(tabs)/dashboard/onboarding`;
    const returnUrl = `${baseUrl}/(tabs)/dashboard`;
    
    accountLinkMutation.mutate({
      barberId: user?.id || "",
      refreshUrl,
      returnUrl,
    });
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    createAccountMutation.mutate({ barberId: user.id });
  };

  // Polling function to check account status
  const startPolling = () => {
    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        await refetch();
        const status = await api.stripe.getAccountStatus({ barberId: user?.id || "" });
        if (status.chargesEnabled && status.payoutsEnabled) {
          clearInterval(pollInterval);
          setIsPolling(false);
          // Navigate to dashboard on successful connection
          router.replace("/(tabs)/dashboard");
        }
      } catch (error) {
        console.error('Error polling account status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
    }, 120000);
  };

  const isConnected = accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled;

  if (statusLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Connect Stripe" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text style={styles.loadingText}>
            {isPolling ? "Waiting for Stripe setup completion..." : "Checking connection status..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Connect Stripe" }} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: isConnected ? brandColors.success + "20" : brandColors.primary + "20" }]}>
            {isConnected ? (
              <CheckCircle size={48} color={brandColors.success} />
            ) : (
              <CreditCard size={48} color={brandColors.primary} />
            )}
          </View>
          
          <Text style={styles.title}>
            {isConnected ? "Stripe Connected!" : "Connect Your Stripe Account"}
          </Text>
          
          <Text style={styles.subtitle}>
            {isConnected 
              ? "Your account is ready to accept payments and receive payouts."
              : "Connect your Stripe account to start accepting payments from clients."
            }
          </Text>
        </View>

        {isConnected ? (
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <CheckCircle size={20} color={brandColors.success} />
              <Text style={styles.statusText}>Charges enabled</Text>
            </View>
            <View style={styles.statusItem}>
              <CheckCircle size={20} color={brandColors.success} />
              <Text style={styles.statusText}>Payouts enabled</Text>
            </View>
          </View>
        ) : (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={brandColors.success} />
              <Text style={styles.featureText}>Accept credit card payments</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={brandColors.success} />
              <Text style={styles.featureText}>Automatic payouts to your bank</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={brandColors.success} />
              <Text style={styles.featureText}>Transaction history and reporting</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={brandColors.success} />
              <Text style={styles.featureText}>Secure payment processing</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {isConnected ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/dashboard")}
            >
              <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, isConnecting && styles.disabledButton]}
                onPress={handleConnectStripe}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <ExternalLink size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Connect with Stripe</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push("/(tabs)/dashboard")}
              >
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {!isConnected && (
          <View style={styles.disclaimer}>
            <AlertCircle size={16} color={brandColors.textLight} />
            <Text style={styles.disclaimerText}>
              You'll be redirected to Stripe to complete the setup process. This is secure and takes just a few minutes.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: brandColors.textLight,
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: brandColors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: brandColors.textLight,
    textAlign: "center",
    lineHeight: 24,
  },
  statusContainer: {
    backgroundColor: brandColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: brandColors.text,
    marginLeft: 12,
    fontWeight: "500",
  },
  featuresContainer: {
    backgroundColor: brandColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: brandColors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: brandColors.textLight,
    marginLeft: 12,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: brandColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: brandColors.textLight,
    fontSize: 16,
    fontWeight: "500",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 16,
    backgroundColor: brandColors.background,
    borderRadius: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: brandColors.textLight,
    lineHeight: 18,
  },
});