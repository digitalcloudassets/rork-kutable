import { Stack } from "expo-router";
import React from "react";
import { Tokens } from "@/theme/tokens";

export default function ManageLayout() {
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
          headerShown: false,
        }}
      />
    </Stack>
  );
}