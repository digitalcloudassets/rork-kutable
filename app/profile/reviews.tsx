import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Star } from "lucide-react-native";

export default function ReviewsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Reviews",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.emptyState}>
          <Star size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Reviews</Text>
          <Text style={styles.emptyDescription}>
            View and manage your customer reviews and ratings.
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
    backgroundColor: "#f8f9fa",
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
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});