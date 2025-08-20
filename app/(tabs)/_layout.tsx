import { Tabs } from "expo-router";
import { Search, Calendar, Settings, User } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { BRAND } from "@/config/brand";

export default function TabLayout() {
  const { user } = useAuth();
  const isBarber = user?.role === "barber";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: BRAND.BG_DARK,
        },
        headerTintColor: BRAND.TEXT_PRIMARY,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: BRAND.SURFACE_DARK,
          borderTopColor: '#202633',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: BRAND.TEXT_PRIMARY,
        tabBarInactiveTintColor: BRAND.TEXT_SECONDARY,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          headerTitle: BRAND.APP_NAME,
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "My Bookings",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      {isBarber && (
        <Tabs.Screen
          name="manage"
          options={{
            title: "Manage",
            headerShown: false,
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      )}
      {isBarber && (
        <Tabs.Screen
          name="dashboard"
          options={{
            href: null, // Hide from tab bar but keep accessible
            headerShown: false,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}