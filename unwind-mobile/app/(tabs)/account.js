import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../firebaseConfig"; // Assuming auth is exported from here
import { getProfile, deleteUserAccount } from "../../api/auth";
import { generateDailySummary } from "../../api/dailySummary";
import { checkTodaySyncStatus, getSyncStatusMessage } from "../../utils/syncStatusUtils";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { closeDB, openDB } from "../../storage/mainDb";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
// import { exportDatabase } from "../testDb";

export default function AccountScreen() {
  const [userInfo, setUserInfo] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userInfo.name);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [clearDataModalVisible, setClearDataModalVisible] = useState(false);
  const [clearDataPassword, setClearDataPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    journalEntries: 0,
    overthinkingLogs: 0,
    mistakeEntries: 0,
    streaks: 0,
  });
  
  // Daily Summary states
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryAlreadyGenerated, setSummaryAlreadyGenerated] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        await loadUserInfo();
        await loadUserStats();
        await fetchProfile();
        await checkDailySummaryStatus();
      } catch (error) {
        if (!isMounted) return;

        console.error("Error loading account data:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem("userInfo");
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo); /*userInfo:{
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: '2024-01-15',
  }*/
        setUserInfo(parsed);
        setEditName(parsed.name);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  // const getIdToken = async () => {
  //   try {
  //     const currentUser = auth.currentUser;
  //     if (!currentUser) return null;
  //     return await currentUser.getIdToken();
  //   } catch (e) {
  //     return null;
  //   }
  // };

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      // Optionally store/merge user info from backend
      if (data?.user) {
        const updatedInfo = {
          ...userInfo,
          email: data.user.email || userInfo.email,
        };
        setUserInfo(updatedInfo);
      }
    } catch (e) {
      // Ignore if unauthorized or network error; UI already works offline
      console.log(
        "Profile fetch failed (expected for offline mode):",
        e.message
      );
    }
  };

  // Removed: password reset is handled directly via Firebase client SDK on Mobile

  const loadUserStats = async () => {
    try {
      const journalEntries = await AsyncStorage.getItem("journalEntries");
      const overthinkingEntries = await AsyncStorage.getItem(
        "overthinkingEntries"
      );
      const mistakeEntries = await AsyncStorage.getItem("mistakeEntries");

      const journalCount = journalEntries
        ? JSON.parse(journalEntries).length
        : 0;
      const overthinkingCount = overthinkingEntries
        ? JSON.parse(overthinkingEntries).length
        : 0;
      const mistakeCount = mistakeEntries
        ? JSON.parse(mistakeEntries).length
        : 0;

      setStats({
        journalEntries: journalCount,
        overthinkingLogs: overthinkingCount,
        mistakeEntries: mistakeCount,
        streaks: Math.floor(
          (journalCount + overthinkingCount + mistakeCount) / 7
        ),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const saveUserInfo = async () => {
    try {
      const updatedInfo = { ...userInfo, name: editName };
      await AsyncStorage.setItem("userInfo", JSON.stringify(updatedInfo));
      setUserInfo(updatedInfo);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user info:", error);
      Alert.alert("Error", "Failed to save user information");
    }
  };

  const cancelEdit = () => {
    setEditName(userInfo.name);
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userInfo");
            router.replace("/auth");
          } catch (error) {
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  const openRateApp = async () => {
    try {
      const iosUrl =
        "itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review";
      const androidUrl = "market://details?id=com.yourcompany.yourapp";
      const androidHttpFallback =
        "https://play.google.com/store/apps/details?id=com.yourcompany.yourapp";

      if (Platform.OS === "ios") {
        await Linking.openURL(iosUrl);
      } else {
        const canOpenMarket = await Linking.canOpenURL(androidUrl);
        await Linking.openURL(canOpenMarket ? androidUrl : androidHttpFallback);
      }
    } catch (e) {
      // Fallback: open a generic landing page if needed
      try {
        await Linking.openURL("https://myapp.com");
      } catch {}
    }
  };

  const clearAllData = () => {
    setClearDataPassword("");
    setClearDataModalVisible(true);
  };

  const confirmDeleteAll = async () => {
    if (!auth?.currentUser) {
      Alert.alert("Not signed in", "Please sign in again and retry.");
      return;
    }
    if (!clearDataPassword.trim()) {
      Alert.alert("Password required", "Enter your password to proceed.");
      return;
    }
    try {
      setDeleting(true);
      const email = userInfo?.email || auth.currentUser.email;
      const credential = EmailAuthProvider.credential(email, clearDataPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await wipeAppSandbox();
      // Re-open a fresh empty DB to reset any in-memory references
      try {
        await openDB();
      } catch {}
      setClearDataModalVisible(false);
      setClearDataPassword("");
      loadUserStats();
      Alert.alert("Deleted", "All in-app data and files have been deleted.");
    } catch (error) {
      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password"
      ) {
        Alert.alert(
          "Incorrect password",
          "The password you entered is incorrect."
        );
      } else {
        Alert.alert("Error", "Failed to delete data. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const wipeAppSandbox = async () => {
    try {
      // Close connection and delete SQLite database (primary and journal files)
      try {
        await closeDB();
        await SQLite.deleteDatabaseAsync("unwind.db");
      } catch (e) {
        // Fallback: remove files directly if API unavailable
        const base = `${FileSystem.documentDirectory}SQLite/`;
        await FileSystem.deleteAsync(`${base}unwind.db`, { idempotent: true });
        await FileSystem.deleteAsync(`${base}unwind.db-wal`, {
          idempotent: true,
        });
        await FileSystem.deleteAsync(`${base}unwind.db-shm`, {
          idempotent: true,
        });
      }

      // Delete app-managed file folders
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}docs/`, {
        idempotent: true,
      });
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}files/`, {
        idempotent: true,
      });
    } catch (e) {
      throw e;
    }
  };

  // Daily Summary Functions
  const checkDailySummaryStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastGenerated = await AsyncStorage.getItem('lastDailySummaryGenerated');
      setSummaryAlreadyGenerated(lastGenerated === today);
    } catch (error) {
      console.error('Error checking daily summary status:', error);
    }
  };

  const handleGenerateDailySummary = async () => {
    try {
      // Check if already generated today
      if (summaryAlreadyGenerated) {
        Alert.alert(
          'Summary Already Generated',
          'Daily summary has already been generated today. Try again tomorrow!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check sync status
      setIsGeneratingSummary(true);
      const syncStatusResult = await checkTodaySyncStatus();
      
      if (!syncStatusResult.isAllSynced && syncStatusResult.totalUnsyncedCount > 0) {
        setIsGeneratingSummary(false);
        setSyncStatus(syncStatusResult);
        setShowSyncModal(true);
        return;
      }

      // Generate summary
      await generateSummaryWithAPI();
    } catch (error) {
      console.error('Error in handleGenerateDailySummary:', error);
      setIsGeneratingSummary(false);
      Alert.alert(
        'Error',
        'Failed to check sync status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const generateSummaryWithAPI = async () => {
    try {
      const result = await generateDailySummary();
      
      if (result.success) {
        // Mark as generated today
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('lastDailySummaryGenerated', today);
        setSummaryAlreadyGenerated(true);
        
        Alert.alert(
          '✅ Daily Summary Generated!',
          result.message || 'Your daily summary has been generated successfully.',
          [{ text: 'Great!' }]
        );
      } else {
        handleSummaryError(result);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert(
        'Generation Failed',
        'Failed to generate daily summary. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSummaryError = (result) => {
    switch (result.error) {
      case 'SUMMARY_EXISTS':
        Alert.alert(
          'Already Generated',
          'Daily summary has already been generated today.',
          [{ text: 'OK' }]
        );
        break;
      case 'NO_DATA':
        Alert.alert(
          'No Data Available',
          'No journal entries, mistakes, or overthinking logs found for today. Please add some data first.',
          [{ text: 'OK' }]
        );
        break;
      case 'AI_UNAVAILABLE':
        Alert.alert(
          'AI Service Unavailable',
          'The AI service is temporarily unavailable. Please try again later.',
          [{ text: 'OK' }]
        );
        break;
      case 'AUTH_ERROR':
        Alert.alert(
          'Authentication Error',
          'Please sign out and sign in again.',
          [{ text: 'OK' }]
        );
        break;
      default:
        Alert.alert(
          'Generation Failed',
          result.message || 'Failed to generate daily summary. Please try again.',
          [{ text: 'OK' }]
        );
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      // Here you would call your existing sync functions
      // For now, we'll simulate syncing and then close the modal
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sync
      
      // Check sync status again
      const newSyncStatus = await checkTodaySyncStatus();
      if (newSyncStatus.isAllSynced) {
        setShowSyncModal(false);
        // Now generate the summary
        await generateSummaryWithAPI();
      } else {
        Alert.alert(
          'Sync Incomplete',
          'Some data is still not synced. Please try again or check your internet connection.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert(
        'Sync Failed',
        'Failed to sync data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = () => {
    

    setConfirmPassword("");
    setConfirmVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (!auth?.currentUser) {
      Alert.alert("Not signed in", "Please sign in again and retry.");
      return;
    }
    if (!confirmPassword.trim()) {
      Alert.alert(
        "Password required",
        "Enter your account password to proceed."
      );
      return;
    }
    try {
      setDeleting(true);
      const email = userInfo?.email || auth.currentUser.email;
      const credential = EmailAuthProvider.credential(email, confirmPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Password is correct, show final confirmation
      setConfirmVisible(false);

      Alert.alert(
        "🚨 Final Confirmation 🚨",
        "You are about to permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setDeleting(false),
          },
          {
            text: "Yes, Delete Everything",
            style: "destructive",
            onPress: async () => {
              try {
                // 1. Call backend to delete cloud data and Firebase user.
                // The idToken is automatically sent by the axios interceptor.
                const result = await deleteUserAccount();
                if (!result.success) {
                  // The API client's error handler will throw an error,
                  // but we can add an extra check here.
                  throw new Error(
                    result.error?.message || "Failed to delete account on server."
                  );
                }

                // 2. Delete all local data
                await wipeAppSandbox();

                Alert.alert(
                  "Account Deleted",
                  "Your account and all associated data have been permanently deleted."
                );
                router.replace("/auth");
              } catch (deleteError) {
                console.error("Error during final deletion step:", deleteError);
                Alert.alert(
                  "Deletion Failed",
                  `Could not complete the account deletion: ${deleteError.message}. Please sign out and try again.`
                );
                setDeleting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setDeleting(false);
      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password"
      ) {
        Alert.alert(
          "Incorrect password",
          "The password you entered is incorrect. Please try again."
        );
      } else {
        console.error("Error re-authenticating:", error);
        Alert.alert(
          "Error",
          "An error occurred during re-authentication. Please try again."
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#6B7280" />
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveUserInfo}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <Ionicons name="close" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileDetails}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{userInfo?.name}</Text>
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Ionicons name="pencil" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.userEmail}>{userInfo?.email}</Text>
                <Text style={styles.joinDate}>
                  Member since{" "}
                  {new Date(userInfo.joinDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>

          <View style={styles.statsGrid}>
            <LinearGradient
              colors={["#E0F2FE", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardInner}>
                <View style={[styles.iconChip, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="book" size={18} color="#2563EB" />
                </View>
                <Text style={styles.statValue}>{stats.journalEntries}</Text>
                <Text style={styles.statLabel}>Journal Entries</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#EDE9FE", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardInner}>
                <View style={[styles.iconChip, { backgroundColor: "#DDD6FE" }]}>
                  <Ionicons name="bulb" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.statValue}>{stats.overthinkingLogs}</Text>
                <Text style={styles.statLabel}>Thoughts Released</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#FEF3C7", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardInner}>
                <View style={[styles.iconChip, { backgroundColor: "#FDE68A" }]}>
                  <Ionicons name="alert-circle" size={18} color="#D97706" />
                </View>
                <Text style={styles.statValue}>{stats.mistakeEntries}</Text>
                <Text style={styles.statLabel}>Lessons Learned</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#FEE2E2", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardInner}>
                <View style={[styles.iconChip, { backgroundColor: "#FECACA" }]}>
                  <Ionicons name="flame" size={18} color="#DC2626" />
                </View>
                <Text style={styles.statValue}>{stats.streaks}</Text>
                <Text style={styles.statLabel}>Week Streaks</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* Generate Daily Summary Button */}
          <TouchableOpacity 
            style={[
              styles.settingItem, 
              styles.dailySummaryButton,
              (summaryAlreadyGenerated || isGeneratingSummary) && styles.disabledSetting
            ]}
            onPress={handleGenerateDailySummary}
            disabled={summaryAlreadyGenerated || isGeneratingSummary}
          >
            <View style={styles.dailySummaryIconContainer}>
              {isGeneratingSummary ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons 
                  name={summaryAlreadyGenerated ? "checkmark-circle" : "analytics"} 
                  size={20} 
                  color={summaryAlreadyGenerated ? "#10B981" : "#3B82F6"} 
                />
              )}
            </View>
            <View style={styles.dailySummaryTextContainer}>
              <Text style={[
                styles.settingText, 
                styles.dailySummaryText,
                (summaryAlreadyGenerated || isGeneratingSummary) && styles.disabledSettingText
              ]}>
                {isGeneratingSummary ? 'Generating Summary...' : 
                 summaryAlreadyGenerated ? 'Daily Summary Generated' : 'Generate Daily Summary'}
              </Text>
              <Text style={styles.dailySummarySubtext}>
                {isGeneratingSummary ? 'Please wait...' :
                 summaryAlreadyGenerated ? 'Generated for today' : 'AI-powered daily insights'}
              </Text>
            </View>
            {!summaryAlreadyGenerated && !isGeneratingSummary && (
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push("/settings/notifications")}
          >
            <Ionicons name="notifications" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push("/settings/privacy")}
          >
            <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={clearAllData}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.settingText, { color: "#EF4444" }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>

        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/support/help-center")}
          >
            <Ionicons name="help-circle" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/support/contact")}
          >
            <Ionicons name="mail" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={openRateApp}>
            <Ionicons name="star" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Rate App</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "88%",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="warning" size={22} color="#DC2626" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                ⚠️ Delete Your Account
              </Text>
            </View>
            <Text
              style={{ color: "#374151", lineHeight: 20, marginBottom: 14 }}
            >
              This is irreversible. It will permanently delete your account, all
              local data, and all cloud-synced data. This action cannot be
              undone.
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>
              Confirm with your account password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
              editable={!deleting}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
                disabled={deleting}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteAccount}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#DC2626",
                  flexDirection: "row",
                  alignItems: "center",
                }}
                disabled={deleting}
              >
                {deleting && (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Clear Data Modal */}
      <Modal
        visible={clearDataModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearDataModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "88%",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="warning" size={22} color="#F59E0B" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Delete All Local Data
              </Text>
            </View>
            <Text
              style={{ color: "#374151", lineHeight: 20, marginBottom: 14 }}
            >
              This will permanently delete all data stored on this device. Your
              account and cloud-synced data will not be affected. This action
              cannot be undone.
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>
              Confirm with your account password
            </Text>
            <TextInput
              value={clearDataPassword}
              onChangeText={setClearDataPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
              editable={!deleting}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setClearDataModalVisible(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
                disabled={deleting}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteAll}
                style={[styles.modalConfirmButton, deleting && styles.modalConfirmButtonDisabled]}
                disabled={deleting}
              >
                {deleting && (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Clear Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Required Modal */}
      <Modal
        visible={showSyncModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSyncModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.syncModalContainer}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.syncModalHeader}
            >
              <Ionicons name="sync" size={24} color="#FFFFFF" />
              <Text style={styles.syncModalTitle}>Sync Required</Text>
            </LinearGradient>
            
            <View style={styles.syncModalBody}>
              <Text style={styles.syncModalMessage}>
                Some data for today is not synced. Please sync first before generating your daily summary.
              </Text>
              
              {syncStatus && (
                <Text style={styles.syncStatusDetails}>
                  {getSyncStatusMessage(syncStatus)}
                </Text>
              )}
              
              <View style={styles.syncModalActions}>
                <TouchableOpacity
                  style={styles.syncCancelButton}
                  onPress={() => setShowSyncModal(false)}
                  disabled={isSyncing}
                >
                  <Text style={styles.syncCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.syncNowButton, isSyncing && styles.syncNowButtonDisabled]}
                  onPress={handleSyncNow}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.syncNowText}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#374151",
    marginRight: 8,
  },
  editButtons: {
    flexDirection: "row",
  },
  saveButton: {
    backgroundColor: "#10B981",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  profileDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCardGradient: {
    borderRadius: 14,
    width: "48%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardInner: {
    padding: 16,
    alignItems: "center",
    minHeight: 120,
    borderRadius: 14,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  settingItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#DC2626", // Red color for destructive action
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
  },
  modalConfirmButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  
  // Daily Summary Button Styles
  dailySummaryButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  dailySummaryIconContainer: {
    marginRight: 12,
  },
  dailySummaryTextContainer: {
    flex: 1,
  },
  dailySummaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  dailySummarySubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  disabledSetting: {
    opacity: 0.7,
    backgroundColor: "#F9FAFB",
  },
  disabledSettingText: {
    color: "#9CA3AF",
  },
  
  // Sync Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  syncModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
  },
  syncModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  syncModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  syncModalBody: {
    padding: 20,
    paddingTop: 16,
  },
  syncModalMessage: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 12,
  },
  syncStatusDetails: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  syncModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  syncCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  syncCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  syncNowButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  syncNowButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  syncNowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
