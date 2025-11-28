import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { useMembership } from "../context/MembershipProvider";
import { fetchPlans, verifyPurchase } from "../api/utils";
import PlanCard from "./PlanCard";

// Detect if running in Expo Go (no native module support)
const IS_DEV_MODE = __DEV__;

// Dynamically load IAP only in build mode
let InAppPurchases = null;

// Only load module if app is NOT running in Expo Go
if (!IS_DEV_MODE && !globalThis.ExpoGo) {
  try {
    InAppPurchases = require("expo-in-app-purchases");
  } catch (err) {
    console.log("In-app purchase module not available in development mode.");
  }
}

const MembershipModal = ({ visible, onClose }) => {
  const { membership, updateMembership, syncMembership } = useMembership();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible]);

  // Load plans from server
  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetchPlans();
      console.log("Plans response:", response.data.plan)
      if (response.status==200) setPlans(response.data.plan);
    } catch (error) {
      Alert.alert("Error", "Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase
  const handlePurchase = async (plan, period = "monthly") => {
    try {
      setPurchasing(true);

      const productId =
        Platform.OS === "ios"
          ? plan.pricing[period].ios_product_id
          : plan.pricing[period].android_product_id;

      let verificationData;

      // Mock IAP in Dev Mode (Expo Go)
      if (IS_DEV_MODE) {
        const mockToken = `MOCK_${Date.now()}_${plan.tier}_${period}`;
        verificationData = {
          platform: Platform.OS,
          productId,
          purchaseToken: Platform.OS === "android" ? mockToken : null,
          transactionReceipt: Platform.OS === "ios" ? mockToken : null,
        };

        Alert.alert(
          "Development Purchase",
          `${plan.name} (${period}) simulated successfully.`,
          [{ text: "OK" }]
        );
      } else {
        // Real IAP flow (EAS Build only)
        const purchaseResult = await InAppPurchases.purchaseItemAsync(productId);

        if (purchaseResult.responseCode !== InAppPurchases.IAPResponseCode.OK) {
          if (
            purchaseResult.responseCode ===
            InAppPurchases.IAPResponseCode.USER_CANCELED
          ) return;

          Alert.alert("Error", "Purchase failed. Try again.");
          return;
        }

        const purchase = purchaseResult.results[0];

        verificationData = {
          platform: Platform.OS,
          productId,
          purchaseToken: Platform.OS === "android" ? purchase.purchaseToken : null,
          transactionReceipt: Platform.OS === "ios" ? purchase.transactionReceipt : null,
        };
      }

      // Verify at backend
      const verifyResponse = await verifyPurchase(verificationData);

      if (verifyResponse.success) {
        await updateMembership(verifyResponse.membership);
        await syncMembership(true);

        Alert.alert(
          "Success!",
          `You now have access to ${plan.name}!`,
          [{ text: "OK", onPress: onClose }]
        );
      } else {
        Alert.alert("Error", "Could not validate purchase.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setPurchasing(false);
    }
  };

  // Restore purchases
  const handleRestorePurchases = async () => {
    if (IS_DEV_MODE) {
      Alert.alert("Unavailable in Expo Go", "Restoring works only in a real build.");
      return;
    }

    try {
      setPurchasing(true);

      const { results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (!results || results.length === 0) {
        Alert.alert("No Purchases", "No purchases found.");
        return;
      }

      const purchase = results[0];

      const verificationData = {
        platform: Platform.OS,
        productId: purchase.productId,
        purchaseToken: Platform.OS === "android" ? purchase.purchaseToken : null,
        transactionReceipt: Platform.OS === "ios" ? purchase.transactionReceipt : null,
      };

      const verifyResponse = await verifyPurchase(verificationData);

      if (verifyResponse.success) {
        await updateMembership(verifyResponse.membership);
        await syncMembership(true);
        Alert.alert("Success", "Your membership has been restored!");
      } else {
        Alert.alert("No Active Subscription", "Nothing to restore.");
      }
    } catch {
      Alert.alert("Error", "Restore failed.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal isVisible={visible} onBackdropPress={onClose} onSwipeComplete={onClose} swipeDirection="down" style={styles.modal}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Current Plan */}
        <View style={styles.currentMembershipBadge}>
          <Text style={styles.currentMembershipText}>Current: {membership.tier.toUpperCase()}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <ScrollView style={styles.plansContainer}>
            {plans?.pricing?.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={membership.tier === plan.tier}
                onPurchase={handlePurchase}
                disabled={purchasing}
              />
            ))}
          </ScrollView>
        )}

        {/* Footer */}
        <TouchableOpacity onPress={handleRestorePurchases} disabled={purchasing} style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// const PlanCard = ({ plan, isCurrentPlan, onPurchase, disabled }) => {
//   const [selectedPeriod, setSelectedPeriod] = useState("monthly");

//   return (
//     <View style={styles.planCard}>
//       <Text style={styles.planName}>{plan.name}</Text>

//       {!isCurrentPlan ? (
//         <TouchableOpacity
//           disabled={disabled}
//           style={[styles.purchaseButton, disabled && { opacity: 0.5 }]}
//           onPress={() => onPurchase(plan, selectedPeriod)}
//         >
//           <Text style={styles.purchaseButtonText}>
//             {disabled ? "Processing..." : "Subscribe Now"}
//           </Text>
//         </TouchableOpacity>
//       ) : (
//         <View style={styles.currentPlanButton}>
//           <Text style={styles.currentPlanButtonText}>Current Plan</Text>
//         </View>
//       )}
//     </View>
//   );
// };

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
  },
  currentMembershipBadge: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    alignItems: "center",
  },
  currentMembershipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  premiumCard: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  currentPlanCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#f1f8f4",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  pricingContainer: {
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: "#007AFF",
  },
  periodButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  pricePeriod: {
    fontSize: 16,
    color: "#666",
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  purchaseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  currentPlanButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  currentPlanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  freeButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  freeButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});


export default MembershipModal;
