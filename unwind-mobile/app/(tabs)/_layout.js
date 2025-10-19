import React, { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { initTable } from "../../storage/initTable";
import { AuthContext } from "../../context/AuthProvider";

export default function TabLayout() {
  const {user } = useContext(AuthContext);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       await initTable();
  //       setDbReady(true);
  //     } catch (e) {
  //       console.error("Failed to initialize database tables:", e);
  //       setDbReady(true); // allow app to render even if init partially fails
  //     }
  //   })();
  // }, []);

  // if (!dbReady) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         alignItems: "center",
  //         justifyContent: "center",
  //         backgroundColor: "#FFFFFF",
  //       }}
  //     >
  //       <ActivityIndicator size="large" color="#3B82F6" />
  //       <Text style={{ marginTop: 12, color: "#6B7280" }}>
  //         Preparing your data...
  //       </Text>
  //     </View>
  //   );
  // }

console.log("Rendering TabLayout, user:", user);

if (!user) return <Redirect href="/(auth)" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="overthinking"
        options={{
          title: "Overthinking",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="bulb" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mistakes"
        options={{
          title: "Mistakes",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="alert-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
