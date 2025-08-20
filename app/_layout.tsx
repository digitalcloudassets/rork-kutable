import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { BookingProvider } from "@/providers/BookingProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth/client-signup" options={{ title: "Client Sign Up", presentation: "modal" }} />
      <Stack.Screen name="auth/client-signin" options={{ title: "Client Sign In", presentation: "modal" }} />
      <Stack.Screen name="auth/barber-signup" options={{ title: "Barber Sign Up", presentation: "modal" }} />
      <Stack.Screen name="auth/barber-signin" options={{ title: "Barber Sign In", presentation: "modal" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="barber/[id]" options={{ title: "Barber Profile", presentation: "card" }} />
      <Stack.Screen name="booking/service" options={{ title: "Select Service", presentation: "modal" }} />
      <Stack.Screen name="booking/time" options={{ title: "Select Time", presentation: "modal" }} />
      <Stack.Screen name="booking/details" options={{ title: "Booking Details", presentation: "modal" }} />
      <Stack.Screen name="booking/payment" options={{ title: "Payment", presentation: "modal" }} />
      <Stack.Screen name="booking/confirmation" options={{ title: "Confirmation", presentation: "modal", headerLeft: () => null }} />
      <Stack.Screen name="barber-onboarding" options={{ title: "Become a Barber", presentation: "modal" }} />
      <Stack.Screen name="manage-services" options={{ title: "Manage Services", presentation: "modal" }} />
      <Stack.Screen name="earnings-details" options={{ title: "Earnings Details", presentation: "modal" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy", presentation: "modal" }} />
      <Stack.Screen name="terms-of-service" options={{ title: "Terms of Service", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <BookingProvider>
              <RootLayoutNav />
            </BookingProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}