import { Stack } from "expo-router";
import React from "react";
import { BRAND } from "@/config/brand";

export default function ManageLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: BRAND.BG_DARK,
        },
        headerTintColor: BRAND.TEXT_PRIMARY,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Manage",
        }}
      />
    </Stack>
  );
}