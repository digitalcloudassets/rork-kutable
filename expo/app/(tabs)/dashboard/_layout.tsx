import { Stack } from "expo-router";
import { Tokens } from "@/theme/tokens";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: Tokens.bg,
      },
      headerTintColor: Tokens.text,
      headerTitleStyle: {
        fontWeight: '700',
      },
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Dashboard",
          headerShown: false, // Let the main dashboard handle its own header
        }} 
      />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          title: "Connect Stripe",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="services" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="calendar" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="gallery" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="earnings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="system" 
        options={{ 
          title: "System Status",
        }} 
      />
    </Stack>
  );
}