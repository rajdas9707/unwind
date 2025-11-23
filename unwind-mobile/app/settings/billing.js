import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMembership } from "../../context/MembershipProvider";
import { fetchMembershipStatus } from "../../api/membership";
// import MembershipModal from "../../components/MembershipModal";

export default function BillingScreen() {
  const { membership = {}, syncMembership } = useMembership();
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // const [syncing, setSyncing] = useState(false);

  // Helper function to format feature names
  const formatFeatureName = (featureId) => {
    const names = {
      basic_journal: "Basic Journal",
      mood_tracking: "Mood Tracking",
      basic_reminders: "Basic Reminders",
      unlimited_reminders: "Unlimited Reminders",
      advanced_analytics: "Advanced Analytics",
      meditation_library: "Meditation Library",
      ai_insights: "AI Insights",
      priority_support: "Priority Support",
      offline_mode: "Offline Mode",
      custom_themes: "Custom Themes",
      export_data: "Export Data",
    };
    return names[featureId] || featureId.replace(/_/g, " ");
  };

  // Ensure membership has default values
  const membershipData = {
    tier: membership.tier || "free",
    expiry: membership.expiry || null,
    features: membership.features || [],
    lastUpdated: membership.lastUpdated || new Date().toISOString(),
    ...membership,
  };

  useEffect(()=>{
    const  fetchMemberData=async ()=>{
      try {
        const response=await  syncMembership(true)
        // console.log("membership from billing page", response.data)
      } catch (error) {
        console.log("error fetching membership", error)
      }
    }
    fetchMemberData()
   
   
  },[])
  // useEffect(() => {
  //   // Sync membership on mount
  //   if (syncMembership) {
  //     syncMembership().catch((err) =>
  //       console.log("Membership sync failed:", err)
  //     );
  //   }
  // }, [syncMembership]);

  // const handleRefresh = async () => {
  //   setSyncing(true);
  //   try {
  //     await syncMembership(true);
  //     Alert.alert("Success", "Membership status refreshed!");
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to refresh membership");
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  const getTierColor = (tier = "free") => {
    switch (tier) {
      case "premium":
        return { start: "#8B5CF6", end: "#6366F1" };
      case "pro":
        return { start: "#3B82F6", end: "#06B6D4" };
      default:
        return { start: "#6B7280", end: "#9CA3AF" };
    }
  };

  const getTierIcon = (tier = "free") => {
    switch (tier) {
      case "premium":
        return "diamond";
      case "pro":
        return "star";
      default:
        return "person";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!membershipData.expiry) return null;
    const now = new Date();
    const expiry = new Date(membershipData.expiry);
    const diff = expiry - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const isExpired = () => {
    if (!membershipData.expiry) return false;
    return new Date(membershipData.expiry) < new Date();
  };

  const tierColors = getTierColor(membershipData.tier);
  const daysRemaining = getDaysRemaining();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing & Membership</Text>
        {/* <TouchableOpacity onPress={handleRefresh} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Ionicons name="refresh" size={24} color="#111827" />
          )}
        </TouchableOpacity> */}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Card */}
        <LinearGradient
          colors={[tierColors.start, tierColors.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.planHeader}>
            <View style={styles.planIconContainer}>
              <Ionicons
                name={getTierIcon(membershipData.tier)}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planTier}>
                {membershipData?.tier?.toUpperCase()}
              </Text>
              <Text style={styles.planSubtitle}>Current Plan</Text>
            </View>
          </View>

          {membershipData.tier !== "free" && membershipData?.expiry && (
            <View style={styles.planDetails}>
              <View style={styles.planDetailRow}>
                <Ionicons name="calendar" size={16} color="#FFFFFF" />
                <Text style={styles.planDetailText}>
                  Expires: {formatDate(membershipData?.expiry)}
                </Text>
              </View>
              {daysRemaining !== null && (
                <View style={styles.planDetailRow}>
                  <Ionicons name="time" size={16} color="#FFFFFF" />
                  <Text style={styles.planDetailText}>
                    {isExpired()
                      ? "Expired"
                      : `${daysRemaining} days remaining`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* {membershipData.tier === "free" && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={tierColors.start}
              />
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          )} */}
        </LinearGradient>

        {/* Features Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Features</Text>
          <View style={styles.featuresContainer}>
            {membershipData.features && membershipData.features.length > 0 ? (
              membershipData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10B981"
                    />
                  </View>
                  <Text style={styles.featureText}>
                    {formatFeatureName(feature)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noFeaturesText}>
                No premium features. Upgrade to unlock more!
              </Text>
            )}
          </View>
        </View> */}

        {/* Upgrade Section */}
        {/* {membershipData.tier !== "premium" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>
            <View style={styles.upgradeCard}>
              <Ionicons name="rocket" size={40} color="#8B5CF6" />
              <Text style={styles.upgradeCardTitle}>
                Unlock{" "}
                {membershipData.tier === "free" ? "Pro & Premium" : "Premium"}{" "}
                Features
              </Text>
              <Text style={styles.upgradeCardDescription}>
                Get access to advanced analytics, unlimited features, and
                priority support
              </Text>
              <TouchableOpacity
                style={styles.upgradeCardButton}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.upgradeCardButtonText}>View Plans</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )} */}

        {/* Membership Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isExpired() ? "#EF4444" : "#10B981",
                    },
                  ]}
                />
                <Text style={styles.infoValue}>
                  {isExpired() ? "Expired" : "Active"}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plan Type</Text>
              <Text style={styles.infoValue}>
                {membershipData?.tier?.toUpperCase()}
              </Text>
            </View>

            {membership.expiry && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Renewal Date</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(membership.expiry)}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Features Unlocked</Text>
              <Text style={styles.infoValue}>
                {membership.features?.length || 0}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {formatDate(membership.lastUpdated)}
              </Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => router.push("/support/contact")}
          >
            <Ionicons name="mail" size={20} color="#6B7280" />
            <Text style={styles.helpText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpItem}
            onPress={() => router.push("/support/help-center")}
          >
            <Ionicons name="help-circle" size={20} color="#6B7280" />
            <Text style={styles.helpText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Membership Modal */}
      {/* <MembershipModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // Balance the back button
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTier: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  planSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  planDetails: {
    marginTop: 8,
  },
  planDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  planDetailText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  featuresContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  featureIconContainer: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  noFeaturesText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 16,
  },
  upgradeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  upgradeCardDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeCardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  upgradeCardButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 8,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  helpItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
});
