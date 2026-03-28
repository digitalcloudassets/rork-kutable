import React from 'react';
import { Stack } from 'expo-router';
import { Tokens } from '@/theme/tokens';

export default function BookingLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: Tokens.bg,
      },
      headerTintColor: Tokens.text,
      headerTitleStyle: {
        fontWeight: '700',
      },
    }}>
      <Stack.Screen 
        name="service" 
        options={{ 
          title: 'Select Service',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="time" 
        options={{ 
          title: 'Select Time',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ 
          title: 'Your Details',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="payment" 
        options={{ 
          title: 'Payment',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="confirmation" 
        options={{ 
          title: 'Confirmed',
          headerLeft: () => null, // Remove back button
          gestureEnabled: false, // Disable swipe back
        }} 
      />
    </Stack>
  );
}