import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as IAPurchases from "expo-in-app-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import utilities and API functions
import {
  performLocalBackup,
  performLocalRestore,
  getBackupStats,
  createBackup,
  restoreBackup,
} from "../../utils/backupManager";
import {
  canUseCloudBackup,
  getMembershipStatus,
  updateMembershipAfterPurchase,
  getPremiumPlans,
} from "../../api/membership";
import {
  uploadBackupToCloud,
  downloadBackupFromCloud,
  getCloudBackupsList,
} from "../../api/backup";

/**
 * BackupRestoreScreen
 * Main screen for handling backup and restore operations
 * Supports both local (free) and cloud (premium) backup options
 */
export default function BackupRestoreScreen() {
  const [loading, setLoading] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [cloudBackups, setCloudBackups] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumPlans, setPremiumPlans] = useState([]);

  useEffect(() => {
    loadBackupInfo();
    checkPremiumStatus();
    initializeIAP();
  }, []);

  // Initialize In-App Purchases
  const initializeIAP = async () => {
    try {
      await IAPurchases.connectAsync();
      console.log("✅ IAP initialized");
    } catch (error) {
      console.error("Error initializing IAP:", error);
    }
  };

  // Load backup statistics and information
  const loadBackupInfo = async () => {
    try {
      const stats = await getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error("Error loading backup info:", error);
    }
  };

  // Check if user has premium membership
  const checkPremiumStatus = async () => {
    try {
      const hasPremium = await canUseCloudBackup();
      setIsPremium(hasPremium);

      if (hasPremium) {
        const status = await getMembershipStatus();
        setMembershipStatus(status);
        await loadCloudBackups();
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremium(false);
    }
  };

  // Load list of cloud backups
  const loadCloudBackups = async () => {
    try {
      const backups = await getCloudBackupsList();
      setCloudBackups(backups);
    } catch (error) {
      console.error("Error loading cloud backups:", error);
    }
  };

  // Handle local backup
  const handleLocalBackup = () => {
    Alert.alert(
      "Create Local Backup",
      "This will export all your data (notes, journals, tasks, etc.) to a file that you can save to your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Backup",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await performLocalBackup();

              if (result.success) {
                Alert.alert(
                  "✅ Backup Created",
                  `Your backup (${result.size}) has been saved. You can now share or save it to your device.`,
                  [{ text: "OK" }]
                );
                await loadBackupInfo();
              } else {
                Alert.alert(
                  "❌ Backup Failed",
                  result.error || "Failed to create backup. Please try again.",
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              Alert.alert(
                "❌ Error",
                "Failed to create backup. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle local restore
  const handleLocalRestore = () => {
    Alert.alert(
      "⚠️ Restore from Backup",
      "This will REPLACE all your current data with the data from the backup file. This action cannot be undone.\n\nMake sure you have a recent backup of your current data before proceeding.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await performLocalRestore();

              if (result.cancelled) {
                setLoading(false);
                return;
              }

              if (result.success) {
                Alert.alert(
                  "✅ Restore Complete",
                  "Your data has been restored successfully. The app will now restart to apply the changes.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // In a real app, you might want to restart or reload
                        loadBackupInfo();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "❌ Restore Failed",
                  result.error || "Failed to restore backup. Please try again.",
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              Alert.alert(
                "❌ Error",
                "Failed to restore backup. Please check the file and try again.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle cloud backup
  const handleCloudBackup = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    Alert.alert(
      "Create Cloud Backup",
      "This will upload all your data to secure cloud storage. You can restore it from any device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upload",
          onPress: async () => {
            setLoading(true);
            try {
              const backup = await createBackup();
              const result = await uploadBackupToCloud(backup);

              // Store cloud backup info
              await AsyncStorage.setItem(
                "lastBackupDate",
                JSON.stringify({
                  date: new Date().toISOString(),
                  type: "cloud",
                  size: backup.metadata.size,
                  backupId: result.backupId,
                })
              );

              Alert.alert(
                "✅ Cloud Backup Created",
                `Your data has been securely backed up to the cloud.\n\nSize: ${backup.metadata.sizeFormatted}`,
                [{ text: "OK" }]
              );

              await loadBackupInfo();
              await loadCloudBackups();
            } catch (error) {
              Alert.alert(
                "❌ Backup Failed",
                error.message || "Failed to upload backup. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle cloud restore
  const handleCloudRestore = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    Alert.alert(
      "⚠️ Restore from Cloud",
      "This will REPLACE all your current data with your latest cloud backup. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const backupData = await downloadBackupFromCloud();
              await restoreBackup(backupData);

              Alert.alert(
                "✅ Restore Complete",
                "Your data has been restored from the cloud successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      loadBackupInfo();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "❌ Restore Failed",
                error.message || "Failed to restore from cloud. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle premium purchase
  const handlePremiumPurchase = async (productId) => {
    try {
      setLoading(true);

      // Get available products
      const { responseCode, results } = await IAPurchases.getProductsAsync([
        productId,
      ]);

      if (responseCode !== IAPurchases.IAPResponseCode.OK) {
        throw new Error("Failed to load product information");
      }

      // Purchase the product
      await IAPurchases.purchaseItemAsync(productId);

      // Get purchase history to verify
      const purchaseHistory = await IAPurchases.getPurchaseHistoryAsync();

      if (purchaseHistory.results.length > 0) {
        const latestPurchase = purchaseHistory.results[0];

        // Send purchase info to backend
        await updateMembershipAfterPurchase({
          purchaseToken: latestPurchase.transactionReceipt,
          productId: productId,
          platform: Platform.OS,
        });

        Alert.alert(
          "🎉 Premium Activated!",
          "You now have access to cloud backup and all premium features!",
          [
            {
              text: "OK",
              onPress: () => {
                setShowPremiumModal(false);
                checkPremiumStatus();
              },
            },
          ]
        );
      }
    } catch (error) {
      if (error.code === "E_USER_CANCELLED") {
        // User cancelled, do nothing
        return;
      }

      Alert.alert(
        "❌ Purchase Failed",
        "Failed to complete purchase. Please try again or contact support.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Render loading overlay
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Backup & Restore</Text>
          <Text style={styles.headerSubtitle}>
            Keep your data safe and accessible
          </Text>
        </View>

        {/* Backup Stats */}
        {backupStats && (
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Records:</Text>
              <Text style={styles.statValue}>{backupStats.totalRecords}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Last Backup:</Text>
              <Text style={styles.statValue}>
                {backupStats.lastBackupDate
                  ? formatDate(backupStats.lastBackupDate.date)
                  : "Never"}
              </Text>
            </View>
            {backupStats.lastBackupDate && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Backup Type:</Text>
                <Text style={styles.statValue}>
                  {backupStats.lastBackupDate.type === "cloud"
                    ? "☁️ Cloud"
                    : "📱 Local"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Local Backup Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Local Backup (Free)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Save your data to a file on your device. You can share or save it to
            your preferred location.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLocalBackup}
            disabled={loading}
          >
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Create Local Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLocalRestore}
            disabled={loading}
          >
            <Ionicons name="reload-outline" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Restore from File</Text>
          </TouchableOpacity>
        </View>

        {/* Cloud Backup Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-outline" size={24} color="#FF9500" />
            <Text style={styles.sectionTitle}>
              Cloud Backup {!isPremium && "(Premium)"}
            </Text>
          </View>
          <Text style={styles.sectionDescription}>
            Automatically sync your data to secure cloud storage. Access from any
            device.
          </Text>

          {isPremium ? (
            <>
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={handleCloudBackup}
                disabled={loading}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Backup to Cloud</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCloudRestore}
                disabled={loading}
              >
                <Ionicons name="cloud-download-outline" size={20} color="#FF9500" />
                <Text style={[styles.secondaryButtonText, { color: "#FF9500" }]}>
                  Restore from Cloud
                </Text>
              </TouchableOpacity>

              {membershipStatus && (
                <View style={styles.premiumInfo}>
                  <Text style={styles.premiumInfoText}>
                    ✓ Premium Active
                    {membershipStatus.expiresAt &&
                      ` • Expires ${formatDate(membershipStatus.expiresAt)}`}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowPremiumModal(true)}
            >
              <Ionicons name="star-outline" size={20} color="#FF9500" />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Premium Modal (Simplified - you can enhance this) */}
        {showPremiumModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowPremiumModal(false)}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Upgrade to Premium</Text>
              <Text style={styles.modalSubtitle}>
                Get cloud backup and more premium features
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="cloud-outline" size={20} color="#007AFF" />
                  <Text style={styles.featureText}>Automatic Cloud Backup</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
                  <Text style={styles.featureText}>Secure Data Storage</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="sync-outline" size={20} color="#007AFF" />
                  <Text style={styles.featureText}>Multi-Device Sync</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalPurchaseButton}
                onPress={() => handlePremiumPurchase("premium_monthly")}
              >
                <Text style={styles.modalPurchaseButtonText}>
                  Get Premium - $4.99/month
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Backups include all your notes, journals, tasks, habits, and settings.
            Always keep a recent backup before making major changes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#000",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  premiumButton: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: "#FFF4E6",
    borderWidth: 2,
    borderColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: "#FF9500",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  premiumInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  premiumInfoText: {
    color: "#2E7D32",
    fontSize: 14,
    textAlign: "center",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F0F0",
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalClose: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  modalPurchaseButton: {
    backgroundColor: "#FF9500",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  modalPurchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
