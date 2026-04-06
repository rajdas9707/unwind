import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Calendar } from "react-native-calendars";
import { useNetworkStatus } from "../../utils/networkUtils";
// import { AuthContext } from "../../context/AuthProvider";

// Import storage layer (backend-only)
import {
  fetchRecentOverthinkingEntries,
  fetchOverthinkingByDate,
  createOverthinkingEntryLocal,
  toggleOverthinkingDumpedLocal,
  deleteOverthinkingEntryLocal,
} from "../../storage/overthinking/storage";

// Removed database health utilities

import SavingOverlay from "../../components/SavingOverlay";
import { useOperation } from "../../context/OperationContext";

export default function OverthinkingScreen() {
  // const { isReady } = useDatabaseReady();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newThought, setNewThought] = useState("");
  const [newSolution, setNewSolution] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  // Additional loading states for different operations
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(new Set());
  const [isDumpingThought, setIsDumpingThought] = useState(new Set());
  // const { idToken } = useContext(AuthContext); // removed, now handled in client.js

  const isScreenActiveRef = useRef(true);
  const { isOperating, operationMessage, startOperation, endOperation } =
    useOperation();

  const showAlert = (title, message, buttons) => {
    if (!isScreenActiveRef.current) return;
    Alert.alert(title, message, buttons);
  };
  const logError = (...args) => {
    if (!isScreenActiveRef.current) return;
    // eslint-disable-next-line no-console
    console.error(...args);
  };

  // Prevent back navigation when operating
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isOperating) {
          showAlert(
            "Operation in Progress",
            operationMessage || "Please wait while the operation completes.",
            [{ text: "OK" }]
          );
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isOperating, operationMessage]);

  useFocusEffect(
    React.useCallback(() => {
      isScreenActiveRef.current = true;
      return () => {
        isScreenActiveRef.current = false;
      };
    }, [])
  );


  // Load entries when the component mounts or when selectedDate changes
  useEffect(() => {
    let isMounted = true;

    const loadEntriesWithGuard = async () => {
      if (!isMounted) return;

      setLoading(true);

      try {
        let loadedEntries;

        if (selectedDate) {
          console.log("Loading overthinking entries for date:", selectedDate);
          loadedEntries = await fetchOverthinkingByDate(selectedDate);
        } else {
          console.log("Loading recent overthinking entries");
          loadedEntries = await fetchRecentOverthinkingEntries(10);
        }

        if (isMounted) {
          console.log("Loaded overthinking entries:", loadedEntries);
          setEntries(loadedEntries || []);
        }
      } catch (error) {
        if (!isMounted) return;
        logError("Error loading overthinking entries:", error);
        showAlert("Error", "Failed to load overthinking entries: " + (error.message || "Unknown error"));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEntriesWithGuard();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, isOnline]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const fetchData = async () => {
        if (!isMounted) return;

        setLoading(true);

        try {
          let loadedEntries;

          if (selectedDate) {
            console.log("Loading overthinking entries for date:", selectedDate);
            loadedEntries = await fetchOverthinkingByDate(selectedDate);
          } else {
            console.log("Loading recent overthinking entries");
            loadedEntries = await fetchRecentOverthinkingEntries(10);
          }

          if (isMounted) {
            console.log("Loaded overthinking entries:", loadedEntries);
          setEntries(loadedEntries || []);
          }
        } catch (error) {
          if (!isMounted) return;
          logError("Error loading overthinking entries:", error);
          showAlert("Error", "Failed to load overthinking entries: " + (error.message || "Unknown error"));
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchData();

      // Cleanup function
      return () => {
        isMounted = false;
      };
    }, [selectedDate])
  );


  // Navigate to overthinking detail screen
  const viewOverthinkingEntry = (entry) => {
    router.push(`/overthinking/${entry.id}`);
  };

  // Add a new overthinking entry
  const addEntry = async () => {
    if (!newThought.trim() || !newSolution.trim() || !newTitle.trim()) {
      showAlert(
        "All the fields are required",
        "Please describe your overthinking pattern"
      );
      return;
    }

    setIsAddingEntry(true);
    startOperation("Creating overthinking entry...");

    try {
      // Create entry on backend
      const entry = await createOverthinkingEntryLocal({
        title: newTitle.trim(),
        thought: newThought.trim(),
        solution: newSolution.trim(),
      });

      // Reset form and close modal
      setNewThought("");
      setNewSolution("");
      setNewTitle("");
      setShowAddModal(false);

      // Refresh the list
      setLoading(true);
      try {
        const loadedEntries = selectedDate
          ? await fetchOverthinkingByDate(selectedDate)
          : await fetchRecentOverthinkingEntries(10);
        setEntries(loadedEntries || []);
      } catch (error) {
        logError("Error refreshing entries:", error);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      logError("Error adding entry:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create overthinking entry"
      );
    } finally {
      setIsAddingEntry(false);
      endOperation();
    }
  };

  // Delete an overthinking entry
  const deleteEntry = (entry) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Set loading state for this specific entry
          setIsDeletingEntry((prev) => new Set(prev).add(entry.id));

          // Remove from UI immediately for responsive feel
          setEntries(entries.filter((e) => e.id !== entry.id));

          try {
            // Delete from backend
            await deleteOverthinkingEntryLocal({ entry });
          } catch (error) {
            logError("Error deleting entry:", error);
            showAlert("Error", "Failed to delete entry");
            setLoading(true);
            try {
              const loadedEntries = selectedDate
                ? await fetchOverthinkingByDate(selectedDate)
                : await fetchRecentOverthinkingEntries(10);
              setEntries(loadedEntries || []);
            } catch (refreshError) {
              logError("Error loading overthinking entries:", refreshError);
            } finally {
              setLoading(false);
            }
          } finally {
            // Clear loading state for this entry
            setIsDeletingEntry((prev) => {
              const newSet = new Set(prev);
              newSet.delete(entry.id);
              return newSet;
            });
          }
        },
      },
    ]);
  };

  // Toggle dumped status
  const dumpThought = async (entry) => {
    Alert.alert(
      "Release Thought",
      "Are you ready to let go of this overthinking pattern?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          onPress: async () => {
            // Set loading state for this specific entry
            setIsDumpingThought((prev) => new Set(prev).add(entry.id));
            startOperation("Releasing thought...");

            try {
              // Toggle dump status via backend
              await toggleOverthinkingDumpedLocal({
                id: entry.id,
                dumped: true,
              });

              // Refresh the list
              setLoading(true);
              try {
                const loadedEntries = selectedDate
                  ? await fetchOverthinkingByDate(selectedDate)
                  : await fetchRecentOverthinkingEntries(10);
                setEntries(loadedEntries || []);
              } catch (error) {
                logError("Error loading overthinking entries:", error);
              } finally {
                setLoading(false);
              }
            } catch (error) {
              logError("Error toggling dumped status:", error);
              showAlert("Error", "Failed to update entry");
            } finally {
              // Clear loading state for this entry
              setIsDumpingThought((prev) => {
                const newSet = new Set(prev);
                newSet.delete(entry.id);
                return newSet;
              });
              endOperation();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMarkedDates = () => {
    const marked = {};
    entries.forEach((entry) => {
      const date = entry.created_at.split("T")[0];
      marked[date] = {
        marked: true,
        dotColor: "#8B5CF6",
        selectedColor: "#8B5CF6",
      };
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#8B5CF6",
      };
    }
    return marked;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Operation Overlay */}
      <SavingOverlay
        visible={isOperating}
        message={operationMessage || "Processing..."}
        submessage="Please don't navigate away"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Overthinking</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {selectedDate ? formatDate(selectedDate) : "Latest Entries"}
        </Text>
        <View style={styles.networkStatus}>
          <Ionicons
            name={isOnline ? "wifi" : "wifi-outline"}
            size={16}
            color={isOnline ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.networkText,
              { color: isOnline ? "#10B981" : "#EF4444" },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                No overthinking entries yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Track and release your racing thoughts
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryCard, entry.dumped && styles.dumpedCard]}
                onPress={() => viewOverthinkingEntry(entry)}
                activeOpacity={0.7}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryHeaderLeft}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry);
                      }}
                      style={styles.actionButton}
                      disabled={isDeletingEntry.has(entry.id)}
                    >
                      {isDeletingEntry.has(entry.id) ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      )}
                    </TouchableOpacity>

                  </View>
                </View>

                {entry.title ? (
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                ) : null}

                {/* Show mood emoji if available locally */}
                <View style={styles.contentRow}>
                  <Text style={styles.moodEmoji}>{entry.mood}</Text>
                  <View style={styles.thoughtSection}>
                    <Text style={styles.thoughtPreview}>
                      {entry.truncatedThought ||
                        (entry.thought?.length > 120
                          ? entry.thought.substring(0, 120) + "..."
                          : entry.thought)}
                    </Text>
                  </View>
                </View>

                {/* Show solution preview if available locally */}
                {entry.solution && (
                  <View style={styles.solutionPreview}>
                    <Text style={styles.solutionPreviewText}>
                      💡{" "}
                      {entry.solution.length > 80
                        ? entry.solution.substring(0, 80) + "..."
                        : entry.solution}
                    </Text>
                  </View>
                )}

                {/* Simple sync indicator */}
                {entry.synced && (
                  <View style={styles.syncedIndicator}>
                    <Ionicons name="cloud-done" size={14} color="#10B981" />
                    <Text style={styles.syncedIndicatorText}>
                      Tap for full details
                    </Text>
                  </View>
                )}

                <View style={styles.entryFooter}>
                  {!entry.dumped ? (
                    <TouchableOpacity
                      style={styles.dumpButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        dumpThought(entry);
                      }}
                      disabled={isDumpingThought.has(entry.id)}
                    >
                      {isDumpingThought.has(entry.id) ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.dumpButtonText}>
                          Release Thought
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dumpedIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.dumpedText}>Released</Text>
                    </View>
                  )}

                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Overthinking</Text>
            <TouchableOpacity
              onPress={addEntry}
              style={[
                styles.saveButton,
                isAddingEntry && styles.saveButtonDisabled,
              ]}
              disabled={isAddingEntry}
            >
              {isAddingEntry ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Brief summary..."
                placeholderTextColor="#9CA3AF"
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={200}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                What are you overthinking about?
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your racing thoughts..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={newThought}
                onChangeText={setNewThought}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Potential Solution</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What could help resolve this?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={newSolution}
                onChangeText={setNewSolution}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.placeholder} />
          </View>

          <Calendar
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setShowCalendar(false);
            }}
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: "#FFFFFF",
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: "#6B7280",
              selectedDayBackgroundColor: "#8B5CF6",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#8B5CF6",
              dayTextColor: "#2D3748",
              textDisabledColor: "#CBD5E0",
              dotColor: "#8B5CF6",
              selectedDotColor: "#FFFFFF",
              arrowColor: "#8B5CF6",
              monthTextColor: "#2D3748",
              indicatorColor: "#8B5CF6",
            }}
          />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    gap: 4,
  },
  syncAllText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: "#6B7280",
  },
  networkStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  dumpedCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#86EFAC",
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  entryHeaderLeft: {
    flexDirection: "column",
    flex: 1,
  },
  entryDate: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "600",
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    lineHeight: 28,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    padding: 10,
    borderRadius: 12,
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 10,
    marginTop: 2,
  },
  thoughtSection: {
    flex: 1,
  },
  thoughtLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    marginBottom: 4,
  },
  thoughtContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  solutionSection: {
    marginBottom: 12,
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 4,
  },
  solutionContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  entryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dumpButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dumpButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  dumpedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dumpedText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  syncStatusContainer: {
    alignItems: "flex-end",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unsyncedText: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  syncedText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  syncingText: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  placeholder: {
    width: 40,
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#FFFFFF",
    minHeight: 100,
    textAlignVertical: "top",
  },
  // New styles for metadata display
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  intensityBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  intensityText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  // AI Insights Section Styles
  aiInsightsSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  insightGroup: {
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  insightItem: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 2,
    paddingLeft: 8,
  },
  reframeText: {
    fontSize: 13,
    color: "#059669",
    lineHeight: 18,
    fontStyle: "italic",
    paddingLeft: 8,
  },
  urgencyRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  urgencyHigh: {
    backgroundColor: "#EF4444",
  },
  urgencyMedium: {
    backgroundColor: "#F59E0B",
  },
  urgencyLow: {
    backgroundColor: "#10B981",
  },
  urgencyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  // Simplified Card Layout Styles - Local Data Only
  thoughtPreview: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
    flex: 1,
    fontWeight: "400",
  },
  solutionPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  solutionPreviewText: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
    fontWeight: "500",
  },
  syncedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  syncedIndicatorText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
