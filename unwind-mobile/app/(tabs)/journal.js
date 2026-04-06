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
// Removed animation imports
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Calendar } from "react-native-calendars";
import { useNetworkStatus } from "../../utils/networkUtils";
// import { AuthContext } from "../../context/AuthProvider";

// Import storage layer (backend-only)
import {
  fetchRecentJournalEntries,
  fetchJournalsByDate,
  createJournalEntryLocal,
  deleteJournalEntryLocal,
} from "../../storage/journal/storage";

import SavingOverlay from "../../components/SavingOverlay";
import { useOperation } from "../../context/OperationContext";

export default function JournalScreen() {
  // const { isReady } = useDatabaseReady();

  // Debug: Log loading state changes
  useEffect(() => {
    // console.log("loading changed:", loading);
  }, [loading]);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  // Additional loading states for different operations
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(new Set());
  // const { idToken } = useContext(AuthContext); // removed, now handled in client.js

  const isScreenActiveRef = useRef(true);
  const { isOperating, operationMessage, startOperation, endOperation } = useOperation();
  
  const showAlert = (title, message, buttons) => {
    if (!isScreenActiveRef.current) return;
    Alert.alert(title, message, buttons);
  };
  const logError = (...args) => {
    if (!isScreenActiveRef.current) return;
    // eslint-disable-next-line no-console
    console.error(...args);
  };

  // Removed animation logic
  
  // Prevent back navigation when operating
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOperating) {
        showAlert(
          "Operation in Progress",
          operationMessage || "Please wait while the operation completes.",
          [{ text: "OK" }]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    });

    return () => backHandler.remove();
  }, [isOperating, operationMessage]);


  // useEffect(() => {
  //   if (!isReady) return;

  //   let stopMonitoring;
  //   let removeListener;

  //   (async () => {
  //     await loadLatestEntries();
  //     await syncFromBackend();

  //     // Start network monitoring
  //     stopMonitoring = startNetworkMonitoring();

  //     // Add network status listener
  //     removeListener = addNetworkListener((online) => {
  //       try {
  //         const wasOffline = !isOnline;
  //         setIsOnline(online);

  //         if (online && wasOffline) {
  //           // Network restored - show notification and try to sync pending entries
  //           Alert.alert(
  //             "Network Restored",
  //             "Your internet connection is back. Syncing your journal entries...",
  //             [{ text: "OK" }]
  //           );
  //           syncPendingEntries();
  //         }
  //       } catch (error) {
  //         console.log("Error in network listener:", error);
  //       }
  //     });

  //     // Initial network status check
  //     try {
  //       const initialStatus = await checkNetworkStatus();
  //       setIsOnline(initialStatus);
  //     } catch (error) {
  //       console.log("Error checking initial network status:", error);
  //       setIsOnline(false); // Assume offline if we can't check
  //     }
  //   })();

  //   return () => {
  //     if (stopMonitoring) stopMonitoring();
  //     if (removeListener) removeListener();
  //   };
  // }, []);

  // useEffect(() => {
  //   (async () => {
  //     // Load latest entries instead of date-specific entries

  //     await loadLatestEntries();
  //     console.log("Database is ready, loaded latest entries");
  //   })();
  // }, []);

  // Load entries when the component mounts or when selectedDate changes
  useEffect(() => {
    let isMounted = true;

    const loadEntriesWithAbort = async () => {
      if (!isMounted) return;

      // console.log("loadentries function call");
      setLoading(true);

      try {
        let loadedEntries;
        if (selectedDate) {
          loadedEntries = await fetchJournalsByDate(selectedDate);
        } else {
          loadedEntries = await fetchRecentJournalEntries(10);
        }

        if (isMounted) {
          setEntries(loadedEntries || []);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Error loading entries:", error);
        showAlert(
          "Error",
          "Failed to load journal entries: " +
            (error && error.message ? error.message : "Unknown error")
        );
      } finally {
        if (isMounted) {
          // console.log("In finally block, about to setLoading(false)");
          setLoading(false);
        }
      }
    };

    loadEntriesWithAbort();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      isScreenActiveRef.current = true;
      
      // Reload entries when screen comes into focus
      const reloadData = async () => {
        try {
          setLoading(true);
          let loadedEntries;
          if (selectedDate) {
            loadedEntries = await fetchJournalsByDate(selectedDate);
          } else {
            loadedEntries = await fetchRecentJournalEntries(10);
          }
          setEntries(loadedEntries || []);
        } catch (error) {
          console.error("Error reloading entries on focus:", error);
        } finally {
          setLoading(false);
        }
      };
      
      reloadData();
      
      return () => {
        isScreenActiveRef.current = false;
      };
    }, [selectedDate])
  );

  // Update unsynced count periodically
  // useEffect(() => {

  //   const interval = setInterval(() => {
  //     updateUnsyncedCount();
  //   }, 10000); // Check every 10 seconds

  //   return () => clearInterval(interval);
  // }, []);


  // Navigate to journal detail screen
  const viewJournalEntry = (entry) => {
    router.push(`/journal/${entry.id}`);
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

  // Add a new journal entry
  const addEntry = async () => {
    // console.log("Attempting to add new entry");
    if (!newEntry.trim()) {
      showAlert("Error", "Please write something in your journal");
      return;
    }
    
    // Check if user already has a journal entry for today
    const today = new Date().toISOString().split("T")[0];
    const todayEntries = await fetchJournalsByDate(today);
    
    if (todayEntries && todayEntries.length > 0) {
      showAlert(
        "Journal Already Exists",
        "You can only create one journal entry per day. You already have an entry for today.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsAddingEntry(true);
    startOperation("Creating your journal entry...");

    try {
      // Auto-generate title as today's date (formatted nicely)
      const autoTitle = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      // Create entry on backend
      const entry = await createJournalEntryLocal({
        title: autoTitle,
        content: newEntry.trim(),
      });

      // Reset form and close modal
      setNewEntry("");
      setShowAddModal(false);

      // Refresh the list
      setLoading(true);
      try {
        let loadedEntries;
        if (selectedDate) {
          loadedEntries = await fetchJournalsByDate(selectedDate);
        } else {
          loadedEntries = await fetchRecentJournalEntries(10);
        }
        setEntries(loadedEntries || []);
      } catch (error) {
        console.error("Error refreshing entries:", error);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      showAlert("Error", error.message || "Failed to create journal entry");
    } finally {
      setIsAddingEntry(false);
      endOperation();
    }
  };

  // Delete a journal entry
  const deleteEntry = (entry) => {
    showAlert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Set loading state for this specific entry
          setIsDeletingEntry((prev) => new Set(prev).add(entry.id));

          try {
            // Delete from backend
            await deleteJournalEntryLocal({ entry });
            
            // Remove from UI
            setEntries(entries.filter((e) => e.id !== entry.id));
            showAlert("Success", "Entry deleted successfully");
          } catch (error) {
            console.error("Error deleting entry:", error);
            showAlert("Error", error.message || "Failed to delete entry");
            
            // Refresh the list to show current state
            setLoading(true);
            try {
              let loadedEntries;
              if (selectedDate) {
                loadedEntries = await fetchJournalsByDate(selectedDate);
              } else {
                loadedEntries = await fetchRecentJournalEntries(10);
              }
              setEntries(loadedEntries || []);
            } catch (refreshError) {
              console.error("Error refreshing entries:", refreshError);
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

  const getEntriesForDate = (date) => {
    return entries.filter((entry) => entry.date === date);
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
      marked[entry.date] = {
        marked: true,
        dotColor: "#3B82F6",
        selectedColor: "#3B82F6",
      };
    });
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: "#3B82F6",
    };
    return marked;
  };

  const todaysEntries = getEntriesForDate(
    new Date().toISOString().split("T")[0]
  );

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
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={20} color="#3B82F6" />
          </TouchableOpacity>

          {/* Removed test button */}
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {selectedDate ? selectedDate : "Latest Entries"}
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
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No journal entries yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start writing to capture your thoughts
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => viewJournalEntry(entry)}
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

                {/* Display structured AI-processed content for synced entries */}
                {entry.synced && entry.summary && entry.summary.length > 0 ? (
                  <View style={styles.cloudContentSection}>
                    {/* Rating */}
                    {entry.rating && (
                      <View style={styles.ratingRow}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#FFFFFF" />
                          <Text style={styles.ratingText}>{entry.rating}/10</Text>
                        </View>
                        <Text style={styles.ratingLabel}>Day Rating</Text>
                      </View>
                    )}

                    {/* Summary Points */}
                    {entry.summary && entry.summary.length > 0 && (
                      <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>Summary</Text>
                        {entry.summary.slice(0, 2).map((point, index) => (
                          <View key={index} style={styles.summaryPoint}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.summaryText}>{point}</Text>
                          </View>
                        ))}
                        {entry.summary.length > 2 && (
                          <Text style={styles.moreText}>+{entry.summary.length - 2} more</Text>
                        )}
                      </View>
                    )}

                    {/* Positives/Negatives/Lessons in compact format */}
                    <View style={styles.insightsRow}>
                      {entry.positives && entry.positives.length > 0 && (
                        <View style={styles.insightBadge}>
                          <Ionicons name="happy" size={12} color="#10B981" />
                          <Text style={styles.insightCount}>{entry.positives.length}</Text>
                        </View>
                      )}
                      {entry.negatives && entry.negatives.length > 0 && (
                        <View style={styles.insightBadge}>
                          <Ionicons name="warning" size={12} color="#F59E0B" />
                          <Text style={styles.insightCount}>{entry.negatives.length}</Text>
                        </View>
                      )}
                      {entry.lessons && entry.lessons.length > 0 && (
                        <View style={styles.insightBadge}>
                          <Ionicons name="bulb" size={12} color="#3B82F6" />
                          <Text style={styles.insightCount}>{entry.lessons.length}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  /* Fallback to old format for unsynced entries */
                  <View style={styles.contentRow}>
                    <Text style={styles.sentimentEmoji}>{entry.sentiment}</Text>
                    <Text style={styles.entryContent}>
                      {entry.truncatedContent}
                    </Text>
                  </View>
                )}

                <View style={styles.entryFooter}>
                  <View style={styles.syncStatus}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.syncedText}>Saved</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (isOperating) {
            showAlert(
              "Operation in Progress",
              "Please wait while the current operation completes."
            );
          } else {
            setShowAddModal(true);
          }
        }}
        disabled={isOperating}
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
            <Text style={styles.modalTitle}>New Journal Entry</Text>
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

          <View style={styles.dateLabel}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.dateLabelText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind today?"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={10}
            value={newEntry}
            onChangeText={setNewEntry}
            textAlignVertical="top"
            autoFocus
          />
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
              selectedDayBackgroundColor: "#3B82F6",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#3B82F6",
              dayTextColor: "#2D3748",
              textDisabledColor: "#CBD5E0",
              dotColor: "#3B82F6",
              selectedDotColor: "#FFFFFF",
              arrowColor: "#3B82F6",
              monthTextColor: "#2D3748",
              indicatorColor: "#3B82F6",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
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
    backgroundColor: "#3B82F6",
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
    backgroundColor: "#EBF4FF",
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  entryHeaderLeft: {
    flexDirection: "column",
  },
  entryDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sentimentEmoji: {
    fontSize: 22,
    marginRight: 8,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  entryFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 8,
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unsyncedText: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },
  syncedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  syncingText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
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
    backgroundColor: "#3B82F6",
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
  placeholder: {
    width: 40,
  },
  titleInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  dateLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  dateLabelText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  
  // Structured cloud content styles
  cloudContentSection: {
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 4,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  summarySection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  summaryPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 8,
    marginTop: 2,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  moreText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  insightsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  insightCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 3,
  },
});
