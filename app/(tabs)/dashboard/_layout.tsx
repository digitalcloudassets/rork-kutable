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
          title: "Manage Services",
        }} 
      />
      <Stack.Screen 
        name="calendar" 
        options={{ 
          title: "Calendar",
        }} 
      />
      <Stack.Screen 
        name="gallery" 
        options={{ 
          title: "Gallery",
        }} 
      />
      <Stack.Screen 
        name="earnings" 
        options={{ 
          title: "Earnings",
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          title: "Analytics",
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