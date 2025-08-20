import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Scissors,
  Star,
  Calendar,
  Shield,
  FileText
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { BRAND } from "@/config/brand";
import { Tokens } from "@/theme/tokens";
import { ScrollScreen } from "@/components/Screen";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: signOut, style: "destructive" },
      ]
    );
  };

  const profileSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", onPress: () => router.push("/profile/edit") },
        { icon: CreditCard, label: "Payment Methods", onPress: () => router.push("/profile/payments") },
        { icon: Bell, label: "Notifications", onPress: () => router.push("/profile/notifications") },
      ],
    },
    {
      title: "Barber Tools",
      items: [
        { 
          icon: Scissors, 
          label: user?.role === "barber" ? "Barber Settings" : "Become a Barber", 
          onPress: () => user?.role === "barber" ? router.push("/(tabs)/dashboard/services") : router.push("/barber-onboarding") 
        },
        ...(user?.role === "barber" ? [
          { icon: Calendar, label: "Availability", onPress: () => router.push("/(tabs)/dashboard/calendar") },
          { icon: Star, label: "Reviews", onPress: () => router.push("/profile/reviews") },
        ] : []),
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", onPress: () => {} },
        { icon: Settings, label: "Settings", onPress: () => {} },
      ],
    },
    {
      title: "Legal",
      items: [
        { icon: Shield, label: "Privacy Policy", onPress: () => router.push("/privacy-policy") },
        { icon: FileText, label: "Terms of Service", onPress: () => router.push("/terms-of-service") },
      ],
    },
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestState}>
          <User size={64} color={BRAND.TEXT_SECONDARY} />
          <Text style={styles.guestTitle}>Welcome to Kutable</Text>
          <Text style={styles.guestDescription}>
            Sign in to access your profile, bookings, and personalized features.
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push("/auth/welcome")}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollScreen>
      <View style={styles.header}>
        <Image 
          source={{ uri: user?.photoUrl || "https://via.placeholder.com/100" }} 
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user?.role === "barber" && (
          <View style={styles.barberBadge}>
            <Scissors size={14} color="#fff" />
            <Text style={styles.barberBadgeText}>Professional Barber</Text>
          </View>
        )}
      </View>

      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex === section.items.length - 1 && styles.lastMenuItem
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <item.icon size={20} color={BRAND.TEXT_SECONDARY} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color={BRAND.TEXT_SECONDARY} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Kutable v1.0.0</Text>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Tokens.surface,
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Tokens.border,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  barberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Tokens.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  barberBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Tokens.textMuted,
    textTransform: "uppercase",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: Tokens.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Tokens.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: Tokens.text,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Tokens.surface,
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: Tokens.textMuted,
  },
  guestState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Tokens.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  guestDescription: {
    fontSize: 16,
    color: Tokens.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: Tokens.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});