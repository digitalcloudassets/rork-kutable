import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Bell } from "lucide-react-native";
import { Tokens } from "@/theme/tokens";

export default function NotificationsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.emptyState}>
          <Bell size={64} color={Tokens.textMuted} />
          <Text style={styles.emptyTitle}>Notifications</Text>
          <Text style={styles.emptyDescription}>
            Manage your notification preferences and settings.
          </Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Tokens.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: Tokens.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 14,
    color: Tokens.textMuted,
    fontStyle: "italic",
  },
});