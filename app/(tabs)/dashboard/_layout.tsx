import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
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
    </Stack>
  );
}