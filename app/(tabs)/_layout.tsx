import { Tabs } from "expo-router";
import { Search, Calendar, Scissors, User } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { brandColors } from "@/config/brand";

export default function TabLayout() {
  const { user } = useAuth();
  const isBarber = user?.role === "barber";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: "#999",
        headerShown: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#f0f0f0",
          borderTopWidth: 1,
        },
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
          name="dashboard"
          options={{
            title: "Dashboard",
            headerShown: false,
            tabBarIcon: ({ color }) => <Scissors size={24} color={color} />,
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