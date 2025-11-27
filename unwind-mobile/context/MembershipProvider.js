import React, { createContext, useContext, useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthProvider";
import { fetchMembershipStatus } from "../api/membership";
import { useNetworkStatus } from "../utils/networkUtils";

export const MembershipContext = createContext();

const STORAGE_KEY = "@unwind_membership";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const MembershipProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [membership, setMembership] = useState({
    tier: "free",
    expiry: null,
    lastUpdated: null,
    isVerified: false, // Whether data is from server (verified) or cache (unverified)
  });
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();

  // Load membership from cache on mount
  useEffect(() => {
    console.log("MembershipProvider mounted: loading cached membership");
    loadCachedMembership();
  }, []);

  // Sync membership when user logs in or becomes online
  useEffect(() => {
    if (isOnline && user) {
      syncMembership(true);
    }
  }, [user]);

  // Load membership from AsyncStorage
  const loadCachedMembership = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        console.log("Cached membership from loadCachedMembership:", data);
        setMembership({
          ...data,
          isVerified: false, // Mark as unverified cache
        });

        console.log("Loaded cached membership:", data);
      }
    } catch (error) {
      console.error("Error loading cached membership:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync membership with server
  const syncMembership = async (force=false) => {
    try {
      // Check network connectivity
      if (!isOnline) {
        console.log("Offline - using cached membership");
        return;

      }

      // Check if we need to refresh (24h cache)
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached && !force) {
        console.log("Membership cache found:", cached);
        const data = JSON.parse(cached);
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        if (now - lastUpdated < CACHE_DURATION) {
          console.log("Membership cache still valid");
          return;
        }
      }

      console.log("Syncing membership with server...");
      // Fetch from server
      const response = await fetchMembershipStatus();
      console.log("Membership sync response:", response.data);
      if (response.status==404) {
       Alert.alert("User not found. Please log in again."); 
      }
      if (response.status == 200) {
        const newMembership = {
          tier: response.data.membership?.tier,
          expiry: response.data.membership?.expiry,
          features: response.data.membership?.features,
          lastUpdated: new Date().toISOString(),
          isVerified: true,
        };

        // Update state
        setMembership(newMembership);

        // Save to cache
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMembership));
        console.log("✅ Membership synced:", newMembership);
      return 
      }
    } catch (error) {
      console.error("Error syncing membership:", error);
      // Continue with cached data on error
    }
  };

  // Check if user has access to a feature
  const hasFeature = (featureId) => {
    if (!featureId) return true; // No feature check = accessible

    // Check if feature is in user's feature list
    return membership.features.includes(featureId);
  };

  // Check if user has a specific tier or higher
  // const hasTier = (requiredTier) => {
  //   const tierHierarchy = { free: 0, pro: 1, premium: 2 };
  //   const userTierLevel = tierHierarchy[membership.tier] || 0;
  //   const requiredTierLevel = tierHierarchy[requiredTier] || 0;
  //   return userTierLevel >= requiredTierLevel;
  // };

  // Update membership after successful purchase
  const updateMembership = async (newData) => {
    const updated = {
      tier: newData.tier,
      expiry: newData.expiry,
      features: newData.features,
      lastUpdated: new Date().toISOString(),
      isVerified: true,
    };

    setMembership(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log("✅ Membership updated:", updated.tier);
  };

  // Clear membership (for logout)
  const clearMembership = async () => {
    setMembership({
      tier: "free",
      expiry: null,
      features: [],
      lastUpdated: null,
      isVerified: false,
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <MembershipContext.Provider
      value={{
        membership,
        syncMembership,
        updateMembership,
        clearMembership,
        hasFeature
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
};

// Custom hook for easy access - with safe fallback
export const useMembership = () => {
  const context = useContext(MembershipContext);

  // Return safe defaults if context is not available
  if (!context) {
    console.warn(
      "useMembership called outside MembershipProvider - returning defaults"
    );
    return {
      membership: {
        tier: "free",
        expiry: null,
        features: [],
        lastUpdated: new Date().toISOString(),
        isVerified: false,
      },
      syncMembership: () => Promise.resolve(),
      updateMembership: () => {},
      clearMembership: () => {},
    };
  }
  return context;
};
