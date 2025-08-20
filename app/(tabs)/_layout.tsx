import { Tabs } from "expo-router";
import { Search, Calendar, Settings, User } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Tokens } from "@/theme/tokens";

export default function TabLayout() {
  const { user } = useAuth();
  const isBarber = user?.role === "barber";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Tokens.bg },
        headerTintColor: Tokens.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: Tokens.surface,
          borderTopColor: Tokens.border,
        },
        tabBarActiveTintColor: Tokens.text,
        tabBarInactiveTintColor: Tokens.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          headerTitle: "Kutable",
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