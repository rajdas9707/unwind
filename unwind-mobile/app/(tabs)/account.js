import React, { useState, useEffect, useEffectEvent, useContext } from "react";
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
import { getProfile, deleteUserAccount, updateUserName } from "../../api/auth";
import { generateDailySummary } from "../../api/dailySummary";
import {
  checkTodaySyncStatus,
  getSyncStatusMessage,
} from "../../utils/syncStatusUtils";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { closeDB, openDB } from "../../storage/mainDb";
import {
  upsertSummaryScore,
  getSummaryScoresInRange,
} from "../../storage/summaryscore/db";
import { getJournalEntriesByDate } from "../../storage/journal/db";
import { getMistakesEntriesByDate } from "../../storage/mistakes/db";
import { getOverthinkingEntriesByDate } from "../../storage/overthinking/db";
import { purgeAllUserData } from "../../api/data";
import { getFreshToken, API_BASE_URL } from "../../api/utils";
import ChartWebView from "../../components/ChartWebView";
import { formatScoresForChart } from "../../utils/chartUtils";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  updateProfile,
  updateEmail,
  signOut,
} from "firebase/auth";
import { AuthContext } from "../../context/AuthProvider";
import { useNetworkStatus } from "../../utils/networkUtils";
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
  const isOnline = useNetworkStatus();

  const [stats, setStats] = useState({
    journalEntries: 0,
    overthinkingLogs: 0,
    mistakeEntries: 0,
    streaks: 0,
  });

  //  const { user: storedUserInfo } = useContext(AuthContext);
  // Daily Summary states
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryAlreadyGenerated, setSummaryAlreadyGenerated] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Summary scores and UI state
  const [scoreRange, setScoreRange] = useState({ days: 14 });
  const [scores, setScores] = useState([]); // [{date, score}]
  const [cards, setCards] = useState([]); // [{date, score, counts:{journal,mistakes,overthinking}}]

  // Change Name / Email UI state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      try {
        await loadUserInfo();
        await loadUserStats();
        await fetchProfile();
        await checkDailySummaryStatus();
        await loadSummaryScoresForRange();
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

  useEffect(() => {
    console.log("User info updated:account screen");
    console.log("Auth object changed in Account screen:", auth);
  }, [auth]);

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem("userInfo");
      console.log("Loading user info from AuthContext:", storedUserInfo);
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
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
            // ✅ Attempt Firebase sign out
            await signOut(auth);

            // ✅ Only if signOut succeeds, clear local storage
            await AsyncStorage.removeItem("userInfo");

            // ✅ Redirect to auth/login screen
            router.replace("/auth");
          } catch (error) {
            console.warn(
              "Sign out failed (Firebase might be offline):",
              error.message
            );
            // Do NOT clear AsyncStorage or navigate if signOut fails
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

      // Check server availability

      // try {
      //   const health = await authorizedFetch("/api/health", { method: "GET" });
      //   online = health?.status === 200;
      // } catch (_) {
      //   online = false;
      // }

      // If offline, do not allow deletion
      if (!isOnline) {
        setDeleting(false);
        Alert.alert(
          "Offline",
          "You must be online to delete. Please connect to the internet and try again."
        );
        return;
      }
      console.log("Authenticated for data deletion, proceeding...");
      // Purge remote data first (required)
      const res = await purgeAllUserData();
      if (!res.success) {
        setDeleting(false);
        Alert.alert(
          "Server Error",
          res.message || "Failed to delete data on server. Try again later."
        );
        return;
      }

      // Only after successful server purge, wipe local data
      await wipeAppSandbox();

      // Clear rate limit so summary can be generated again
      try {
        await AsyncStorage.removeItem("lastDailySummaryGenerated");
        setSummaryAlreadyGenerated(false);
      } catch (e) {
        // ignore
      }

      // Re-open a fresh empty DB to reset any in-memory references
      try {
        await openDB();
      } catch {}
      setClearDataModalVisible(false);
      setClearDataPassword("");

      // Reset local state
      setStats({
        journalEntries: 0,
        overthinkingLogs: 0,
        mistakeEntries: 0,
        streaks: 0,
      });
      setScores([]);
      setCards([]);

      // Show success alert and navigate to home tab to force refresh
      Alert.alert("Deleted", "All server and local data have been deleted.", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to home tab to force UI refresh across all tabs
            router.replace("/(tabs)");
          },
        },
      ]);
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

  // Change Name flow
  const openChangeName = () => {
    setNewName(userInfo?.name || "");
    setNameModalVisible(true);
  };

  const handleSaveNewName = async () => {
    try {
      const trimmed = (newName || "").trim();
      if (!trimmed) {
        Alert.alert("Invalid name", "Please enter a valid name.");
        return;
      }
      if (!auth?.currentUser) {
        Alert.alert("Not signed in", "Please sign in again and retry.");
        return;
      }
      setUpdatingName(true);
      const userId = auth.currentUser.uid;

      // 1) Update in backend (MongoDB)
      const response = await updateUserName({ uid: userId, newName: trimmed });
      console.log("Backend name update response:", response);

      // 2) Update Firebase profile displayName
      await updateProfile(auth.currentUser, { displayName: trimmed });

      // 3) Update AsyncStorage userInfo
      try {
        const stored = await AsyncStorage.getItem("userInfo");
        let parsed = stored ? JSON.parse(stored) : {};
        parsed = { ...parsed, name: trimmed };
        await AsyncStorage.setItem("userInfo", JSON.stringify(parsed));
        setUserInfo(parsed);
      } catch (e) {
        // Non-fatal: just log it
        console.warn("Failed updating local userInfo name:", e?.message);
      }

      setNameModalVisible(false);
      Alert.alert("Success", "Name updated successfully.");
    } catch (e) {
      console.error("Change name failed:", e);
      Alert.alert(
        "Error",
        e?.message || "Failed to update name. Please try again."
      );
    } finally {
      setUpdatingName(false);
    }
  };

  // Change Email flow
  const openChangeEmail = () => {
    const current = userInfo?.email || auth?.currentUser?.email || "";
    setNewEmail(current);
    setEmailPassword("");
    setEmailModalVisible(true);
  };

  const handleSaveNewEmail = async () => {
    try {
      const email = (newEmail || "").trim();
      const pwd = (emailPassword || "").trim();
      if (!email) {
        Alert.alert("Invalid email", "Please enter a valid email.");
        return;
      }
      if (!pwd) {
        Alert.alert(
          "Password required",
          "Please enter your password to continue."
        );
        return;
      }
      if (!auth?.currentUser) {
        Alert.alert("Not signed in", "Please sign in again and retry.");
        return;
      }
      setUpdatingEmail(true);
      const userId = auth.currentUser.uid;

      // 1) Reauthenticate with current credentials
      const currentEmail = userInfo?.email || auth.currentUser.email;
      const credential = EmailAuthProvider.credential(currentEmail, pwd);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2) Update in backend (MongoDB)
      const token = await getFreshToken();
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/updateEmail`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ userId, newEmail: email }),
      });

      // 3) Update Firebase user email
      await updateEmail(auth.currentUser, email);

      setEmailModalVisible(false);
      Alert.alert("Success", "Email updated successfully! Please re-login.");
    } catch (e) {
      console.error("Change email failed:", e);
      let msg = e?.message || "Failed to update email. Please try again.";
      if (
        e?.code === "auth/invalid-credential" ||
        e?.code === "auth/wrong-password"
      ) {
        msg = "Incorrect password. Please try again.";
      }
      Alert.alert("Error", msg);
    } finally {
      setUpdatingEmail(false);
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

      // Clear AsyncStorage (all local data)
      // Keep only essential auth-related data, clear everything else
      const keysToKeep = ["userInfo"]; // Keep user info for the session
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log("Cleared AsyncStorage keys:", keysToRemove);
      }
    } catch (e) {
      console.error("Error wiping app sandbox:", e);
      throw e;
    }
  };

  // Daily Summary Functions
  const checkDailySummaryStatus = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastGenerated = await AsyncStorage.getItem(
        "lastDailySummaryGenerated"
      );
      setSummaryAlreadyGenerated(lastGenerated === today);
    } catch (error) {
      console.error("Error checking daily summary status:", error);
    }
  };

  const handleGenerateDailySummary = async () => {
    try {
      // Check if already generated today
      if (summaryAlreadyGenerated) {
        Alert.alert(
          "Summary Already Generated",
          "Daily summary has already been generated today. Try again tomorrow!",
          [{ text: "OK" }]
        );
        return;
      }

      // Check sync status
      setIsGeneratingSummary(true);
      const syncStatusResult = await checkTodaySyncStatus();

      if (
        !syncStatusResult.isAllSynced &&
        syncStatusResult.totalUnsyncedCount > 0
      ) {
        setIsGeneratingSummary(false);
        setSyncStatus(syncStatusResult);
        setShowSyncModal(true);
        return;
      }

      // Generate summary
      await generateSummaryWithAPI();
    } catch (error) {
      console.error("Error in handleGenerateDailySummary:", error);
      setIsGeneratingSummary(false);
      Alert.alert("Error", "Failed to check sync status. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const generateSummaryWithAPI = async () => {
    try {
      const result = await generateDailySummary();

      if (result.success) {
        // Mark as generated today
        const today =
          result.data?.date || new Date().toISOString().split("T")[0];
        const score = Number(result.data?.score ?? 0);
        await AsyncStorage.setItem("lastDailySummaryGenerated", today);
        setSummaryAlreadyGenerated(true);

        // Persist score locally for graphs/cards
        try {
          await upsertSummaryScore({ date: today, score });
          await loadSummaryScoresForRange();
        } catch (e) {
          console.warn("Failed to store summary score locally:", e);
        }

        Alert.alert(
          "✅ Daily Summary Generated!",
          result.message ||
            "Your daily summary has been generated successfully.",
          [{ text: "Great!" }]
        );
      } else {
        handleSummaryError(result);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      Alert.alert(
        "Generation Failed",
        "Failed to generate daily summary. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const loadSummaryScoresForRange = async () => {
    try {
      // Determine range: last N days (default 14)
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setDate(today.getDate() - (scoreRange.days - 1));
      const startDate = start.toISOString().slice(0, 10);

      const rows = await getSummaryScoresInRange({ startDate, endDate });
      setScores(rows);

      // Build cards with counts
      const cardPromises = rows.map(async (row) => {
        const [j, m, o] = await Promise.all([
          getJournalEntriesByDate(row.date),
          getMistakesEntriesByDate(row.date),
          getOverthinkingEntriesByDate(row.date),
        ]);
        return {
          date: row.date,
          score: row.score,
          counts: {
            journal: j.length,
            mistakes: m.length,
            overthinking: o.length,
          },
        };
      });
      const cardData = await Promise.all(cardPromises);
      setCards(cardData.reverse()); // show latest first
    } catch (e) {
      console.warn("Failed to load summary scores:", e);
      setScores([]);
      setCards([]);
    }
  };

  const handleSummaryError = (result) => {
    switch (result.error) {
      case "SUMMARY_EXISTS":
        Alert.alert(
          "Already Generated",
          "Daily summary has already been generated today.",
          [{ text: "OK" }]
        );
        break;
      case "NO_DATA":
        Alert.alert(
          "No Data Available",
          "No journal entries, mistakes, or overthinking logs found for today. Please add some data first.",
          [{ text: "OK" }]
        );
        break;
      case "AI_UNAVAILABLE":
        Alert.alert(
          "AI Service Unavailable",
          "The AI service is temporarily unavailable. Please try again later.",
          [{ text: "OK" }]
        );
        break;
      case "AUTH_ERROR":
        Alert.alert(
          "Authentication Error",
          "Please sign out and sign in again.",
          [{ text: "OK" }]
        );
        break;
      default:
        Alert.alert(
          "Generation Failed",
          result.message ||
            "Failed to generate daily summary. Please try again.",
          [{ text: "OK" }]
        );
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      // Here you would call your existing sync functions
      // For now, we'll simulate syncing and then close the modal
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate sync

      // Check sync status again
      const newSyncStatus = await checkTodaySyncStatus();
      if (newSyncStatus.isAllSynced) {
        setShowSyncModal(false);
        // Now generate the summary
        await generateSummaryWithAPI();
      } else {
        Alert.alert(
          "Sync Incomplete",
          "Some data is still not synced. Please try again or check your internet connection.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error syncing data:", error);
      Alert.alert("Sync Failed", "Failed to sync data. Please try again.", [
        { text: "OK" },
      ]);
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
                    result.error?.message ||
                      "Failed to delete account on server."
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
            <View style={styles.profileDetails}>
              {/* Name Row with Pencil on right, modern style */}
              <View style={styles.profileRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userInfo?.name}
                </Text>
                <TouchableOpacity
                  onPress={openChangeName}
                  style={styles.pencilButton}
                >
                  <Ionicons name="pencil" size={18} color="#6366F1" />
                </TouchableOpacity>
              </View>
              {/* Email Row with Pencil on right, modern style */}
              <View style={styles.profileRow}>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {userInfo?.email}
                </Text>
                <TouchableOpacity
                  onPress={openChangeEmail}
                  style={styles.pencilButton}
                >
                  <Ionicons name="pencil" size={18} color="#6366F1" />
                </TouchableOpacity>
              </View>
              <Text style={styles.joinDate}>
                Member since{" "}
                {userInfo?.joinDate
                  ? new Date(userInfo.joinDate).toLocaleDateString()
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>

          {/* Daily Summary Insights (Modern Chart) */}
          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <ChartWebView
              data={formatScoresForChart(scores)}
              height={200}
              onError={(error) => console.log("Chart error:", error)}
            />
          </View>

          <View style={styles.statsGrid}>
            {/* Generate Summary (grid card) */}
            <TouchableOpacity
              style={[
                styles.statCardGradient,
                (summaryAlreadyGenerated || isGeneratingSummary) && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleGenerateDailySummary}
              disabled={summaryAlreadyGenerated || isGeneratingSummary}
            >
              <LinearGradient
                colors={["#ECFEFF", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, flex: 1 }}
              >
                <View style={styles.statCardInner}>
                  <View
                    style={[styles.iconChip, { backgroundColor: "#CFFAFE" }]}
                  >
                    {isGeneratingSummary ? (
                      <ActivityIndicator size="small" color="#06B6D4" />
                    ) : (
                      <Ionicons
                        name={
                          summaryAlreadyGenerated
                            ? "checkmark-circle"
                            : "analytics"
                        }
                        size={18}
                        color={summaryAlreadyGenerated ? "#10B981" : "#06B6D4"}
                      />
                    )}
                  </View>
                  <Text style={styles.statLabel}>
                    {isGeneratingSummary
                      ? "Generating..."
                      : summaryAlreadyGenerated
                      ? "Generated Today"
                      : "Generate Summary"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* View Summary (grid card) */}
            <TouchableOpacity
              style={styles.statCardGradient}
              onPress={() => router.push("/summary")}
            >
              <LinearGradient
                colors={["#EEF2FF", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, flex: 1 }}
              >
                <View style={styles.statCardInner}>
                  <View
                    style={[styles.iconChip, { backgroundColor: "#E0E7FF" }]}
                  >
                    <Ionicons name="bar-chart" size={18} color="#6366F1" />
                  </View>
                  <Text style={styles.statLabel}>View Daily Summary</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View className="section" style={styles.section}>
          <Text style={styles.sectionTitle}>Settings </Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              try {
                console.log("Navigating to billing settings");
                router.push("/settings/billing");
              } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Error", "Failed to navigate to billing settings.");
              }
            }}
          >
            <Ionicons name="card" size={20} color="#8B5CF6" />
            <Text style={styles.settingText}>Billing & Membership</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
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
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
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
              <Ionicons name="person" size={22} color="#111827" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Change Name
              </Text>
            </View>

            <Text style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>
              Enter your new display name
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New name"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
              editable={!updatingName}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setNameModalVisible(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
                disabled={updatingName}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewName}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#10B981",
                  flexDirection: "row",
                  alignItems: "center",
                }}
                disabled={updatingName}
              >
                {updatingName && (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Email Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
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
              <Ionicons name="mail" size={22} color="#111827" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Change Email
              </Text>
            </View>

            <Text style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>
              Enter your new email and current password
            </Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}
              editable={!updatingEmail}
            />
            <TextInput
              value={emailPassword}
              onChangeText={setEmailPassword}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
              editable={!updatingEmail}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setEmailModalVisible(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#F3F4F6",
                  marginRight: 8,
                }}
                disabled={updatingEmail}
              >
                <Text style={{ color: "#374151", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewEmail}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#3B82F6",
                  flexDirection: "row",
                  alignItems: "center",
                }}
                disabled={updatingEmail}
              >
                {updatingEmail && (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                style={[
                  styles.modalConfirmButton,
                  deleting && styles.modalConfirmButtonDisabled,
                ]}
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
              colors={["#3B82F6", "#1D4ED8"]}
              style={styles.syncModalHeader}
            >
              <Ionicons name="sync" size={24} color="#FFFFFF" />
              <Text style={styles.syncModalTitle}>Sync Required</Text>
            </LinearGradient>

            <View style={styles.syncModalBody}>
              <Text style={styles.syncModalMessage}>
                Some data for today is not synced. Please sync first before
                generating your daily summary.
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
                  style={[
                    styles.syncNowButton,
                    isSyncing && styles.syncNowButtonDisabled,
                  ]}
                  onPress={handleSyncNow}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.syncNowText}>
                    {isSyncing ? "Syncing..." : "Sync Now"}
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.1,
  },
  userEmail: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.05,
  },
  pencilButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    elevation: 2,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  joinDate: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 2,
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
