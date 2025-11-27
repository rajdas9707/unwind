import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useMembership } from "../context/MembershipProvider";
// import MembershipModal from "./MembershipModal";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function LockedOverlay() {
  const [showModal, setShowModal] = useState(false);
  const { membership } = useMembership();
  const tier = membership.tier;

  // Show locked overlay with upgrade prompt
  return (
    <View style={styles.container}>
      {/* Blurred background */}
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.overlayContent}>
          {/* Lock icon with gradient background */}
          {/* <LinearGradient
            colors={["#8B5CF6", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lockIconContainer}
          >
            <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
          </LinearGradient> */}

          {/* Title */}
          <Text style={styles.title}>🔒 Premium Feature</Text>

          {/* Description */}
          <Text style={styles.description}>
            This feature requires a membership
          </Text>

          {/* Feature benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Unlock advanced features</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Access premium content</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Priority support</Text>
            </View>
          </View>

          {/* Upgrade button */}
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowModal(true)}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>
                Upgrade to ....to be added
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Current tier badge */}
          <View style={styles.currentTierBadge}>
            <View style={styles.tierDot} />
            <Text style={styles.currentTierText}>
              Current Plan: {tier.toUpperCase()}
            </Text>
          </View>
        </View>
      </BlurView>

      {/* <MembershipModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111827",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "500",
  },
  upgradeButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  currentTierBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B7280",
    marginRight: 8,
  },
  currentTierText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
});
