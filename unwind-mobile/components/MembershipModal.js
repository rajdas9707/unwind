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
import * as InAppPurchases from "expo-in-app-purchases";
import { useMembership } from "../context/MembershipProvider";
import { fetchPlans, verifyPurchase } from "../api/utils";

// Enable mock IAP in development/Expo Go
const IS_DEV_MODE = __DEV__;

let InAppPurchases;

if (IS_DEV_MODE==__DEV__) {
  InAppPurchases = null; // avoid native load in Expo Go
} else {
  InAppPurchases = require("expo-in-app-purchases-store-kit");
}

const MembershipModal = ({ visible, onClose }) => {
  const { membership, updateMembership, syncMembership } = useMembership();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlans();
      // connectIAP();
    }

    // return () => {
    //   disconnectIAP();
    // };
  }, [visible]);

  // Load plans from server
  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetchPlans();
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      Alert.alert("Error", "Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  // Connect to IAP
  // const connectIAP = async () => {
  //   try {
  //     await InAppPurchases.connectAsync();
  //   } catch (error) {
  //     console.error("Error connecting to IAP:", error);
  //   }
  // };

  // Disconnect from IAP
  // const disconnectIAP = async () => {
  //   try {
  //     await InAppPurchases.disconnectAsync();
  //   } catch (error) {
  //     console.error("Error disconnecting from IAP:", error);
  //   }
  // };

  // Handle purchase
  const handlePurchase = async (plan, period = "monthly") => {
    try {
      setPurchasing(true);

      // Get product ID based on platform
      // const productId =
      //   Platform.OS === "ios"
      //     ? plan.pricing[period].ios_product_id
      //     : plan.pricing[period].android_product_id;

      // if (!productId) {
      //   Alert.alert("Error", "Product not available for your platform");
      //   return;
      // }

      let verificationData;

      // **DEV MODE: Use mock token**
      if (IS_DEV_MODE) {
        console.log("🧪 DEV MODE: Simulating IAP purchase with mock token");

        // Generate mock token
        const mockToken = `MOCK_TOKEN_DEV_${Date.now()}_${plan.tier}_${period}`;

        verificationData = {
          platform: Platform.OS,
          productId: productId,
          purchaseToken: Platform.OS === "android" ? mockToken : null,
          transactionReceipt: Platform.OS === "ios" ? mockToken : null,
        };

        Alert.alert(
          "Development Mode",
          `Mock purchase initiated for ${plan.name} (${period})`,
          [{ text: "Continue", onPress: () => {} }]
        );
      } else {
        // **PRODUCTION: Real IAP flow**
        // Get product details
        const { results } = await InAppPurchases.getProductsAsync([productId]);

        if (!results || results.length === 0) {
          Alert.alert("Error", "Product not found");
          return;
        }

        // Make purchase
        const purchaseResult = await InAppPurchases.purchaseItemAsync(
          productId
        );

        if (purchaseResult.responseCode === InAppPurchases.IAPResponseCode.OK) {
          // Get purchase info
          const purchase = purchaseResult.results[0];

          verificationData = {
            platform: Platform.OS,
            productId: productId,
            purchaseToken:
              Platform.OS === "android" ? purchase.purchaseToken : null,
            transactionReceipt:
              Platform.OS === "ios" ? purchase.transactionReceipt : null,
          };
        } else if (
          purchaseResult.responseCode ===
          InAppPurchases.IAPResponseCode.USER_CANCELED
        ) {
          // User cancelled - no alert needed
          return;
        } else {
          Alert.alert("Error", "Purchase failed. Please try again.");
          return;
        }
      }

      // Verify with backend (works for both mock and real)
      const verifyResponse = await verifyPurchase(verificationData);

      if (verifyResponse.success) {
        // Update membership
        await updateMembership(verifyResponse.membership);
        await syncMembership(true);

        const successMessage = verifyResponse.mock
          ? `[DEV] Mock purchase successful! Welcome to ${plan.name}!`
          : `Welcome to ${plan.name}! Your membership is now active.`;

        Alert.alert("Success!", successMessage, [
          { text: "OK", onPress: onClose },
        ]);
      } else {
        Alert.alert(
          "Error",
          "Failed to verify purchase. Please contact support."
        );
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Error", "An error occurred during purchase");
    } finally {
      setPurchasing(false);
    }
  };

  // Restore purchases
  const handleRestorePurchases = async () => {
    try {
      setPurchasing(true);

      const { results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (results && results.length > 0) {
        // Get most recent purchase
        const latestPurchase = results[0];

        // Verify with backend
        const verificationData = {
          platform: Platform.OS,
          productId: latestPurchase.productId,
          purchaseToken:
            Platform.OS === "android" ? latestPurchase.purchaseToken : null,
          transactionReceipt:
            Platform.OS === "ios" ? latestPurchase.transactionReceipt : null,
        };

        const verifyResponse = await verifyPurchase(verificationData);

        if (verifyResponse.success) {
          await updateMembership(verifyResponse.membership);
          await syncMembership(true);
          Alert.alert("Success", "Purchases restored successfully!");
        } else {
          Alert.alert(
            "No Active Purchases",
            "No active purchases found to restore."
          );
        }
      } else {
        Alert.alert("No Purchases", "No purchase history found.");
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Current Membership Badge */}
        <View style={styles.currentMembershipBadge}>
          <Text style={styles.currentMembershipText}>
            Current: {membership.tier.toUpperCase()}
          </Text>
        </View>

        {/* Plans */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.plansContainer}
            showsVerticalScrollIndicator={false}
          >
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                isCurrentPlan={membership.tier === plan.tier}
                onPurchase={handlePurchase}
                disabled={purchasing}
              />
            ))}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={purchasing}
            style={styles.restoreButton}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Plan Card Component
const PlanCard = ({ plan, isCurrentPlan, onPurchase, disabled }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const isPremium = plan.tier === "premium";
  const isFree = plan.tier === "free";

  return (
    <View
      style={[
        styles.planCard,
        isPremium && styles.premiumCard,
        isCurrentPlan && styles.currentPlanCard,
      ]}
    >
      {isPremium && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}

      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planDescription}>{plan.description}</Text>

      {/* Pricing */}
      {!isFree && (
        <View style={styles.pricingContainer}>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "monthly" && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod("monthly")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "monthly" && styles.periodButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "yearly" && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod("yearly")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "yearly" && styles.periodButtonTextActive,
                ]}
              >
                Yearly (Save 20%)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>
            ${(plan.pricing[selectedPeriod].usd / 100).toFixed(2)}
            <Text style={styles.pricePeriod}>
              /{selectedPeriod === "monthly" ? "mo" : "yr"}
            </Text>
          </Text>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>{feature.name}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      {isCurrentPlan ? (
        <View style={styles.currentPlanButton}>
          <Text style={styles.currentPlanButtonText}>Current Plan</Text>
        </View>
      ) : isFree ? (
        <View style={styles.freeButton}>
          <Text style={styles.freeButtonText}>Free Forever</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            disabled && styles.purchaseButtonDisabled,
          ]}
          onPress={() => onPurchase(plan, selectedPeriod)}
          disabled={disabled}
        >
          <Text style={styles.purchaseButtonText}>
            {disabled ? "Processing..." : "Subscribe Now"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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
