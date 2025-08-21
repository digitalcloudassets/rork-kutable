import { Stack } from "expo-router";
import React from "react";
import { Tokens } from "@/theme/tokens";

export default function ClientDashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Tokens.bg,
        },
        headerTintColor: Tokens.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Dashboard",
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: "Favorite Barbers",
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: "Booking History",
        }}
      />
      <Stack.Screen
        name="rewards"
        options={{
          title: "Rewards & Loyalty",
        }}
      />
    </Stack>
  );
}