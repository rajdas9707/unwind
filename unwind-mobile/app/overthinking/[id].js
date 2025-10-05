import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNetworkStatus } from "../../utils/networkUtils";

// Import storage layer
import {
  fetchOverthinkingEntryById,
  updateOverthinkingEntryLocal,
  canSyncOverthinkingToday,
} from "../../storage/overthinking/storage";

// Import API client functions
import {
  createOverthinkingEntry,
  deleteOverthinkingEntry,
  listOverthinkingEntries,
} from "../../api/overthinking";

// Add a function to get overthinking entry by server ID
const getOverthinkingEntryFromServer = async (serverId) => {
  try {
    // Fetch the specific entry from server using list API with server ID
    const response = await listOverthinkingEntries({ limit: 1 });
    // Note: You might need to implement a specific getOverthinkingEntry API endpoint
    // For now, we'll work with the existing API structure
    return response?.entries?.find(entry => entry._id === serverId) || null;
  } catch (error) {
    console.error('Error fetching server entry:', error);
    return null;
  }
};

// Import database operations
import {
  getOverthinkingEntryById,
  markOverthinkingEntrySynced,
  deleteOverthinkingEntryById,
} from "../../storage/overthinking/db";

export default function OverthinkingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  
  const [entry, setEntry] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingServerData, setLoadingServerData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editThought, setEditThought] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync single overthinking entry to server
  const syncOverthinkingEntryToServer = async ({ entry }) => {
    if (entry.synced) {
      return entry; // Already synced
    }

    // Create entry on server
    const serverEntry = await createOverthinkingEntry({
      thought: entry.thought,
      solution: entry.solution,
      date: entry.created_at.split("T")[0],
    });

    console.log("Server entry created:", serverEntry);
    if (!serverEntry || !serverEntry._id) {
      return null;
    }

    // Mark as synced locally - store AI-generated fields in server_meta
    const syncedEntry = await markOverthinkingEntrySynced({
      id: entry.id,
      server_id: serverEntry._id,
      server_meta: {
        createdAt: serverEntry.createdAt,
        updatedAt: serverEntry.updatedAt,
        tags: serverEntry.tags || [],
        mood: serverEntry.mood || null,
        // AI-generated fields from server
        category: serverEntry.category || null,
        intensity: serverEntry.intensity || null,
        triggers: Array.isArray(serverEntry.triggers) ? serverEntry.triggers : [],
        patterns: Array.isArray(serverEntry.patterns) ? serverEntry.patterns : [],
        coping_strategies: Array.isArray(serverEntry.coping_strategies) ? serverEntry.coping_strategies : [],
        reframe: serverEntry.reframe || null,
        urgency: serverEntry.urgency || null,
      },
    });

    return syncedEntry;
  };

  // Get combined local and server data for an overthinking entry (if synced)
  const fetchOverthinkingEntryWithServerData = async (id) => {
    // First get the local entry
    const localEntry = await getOverthinkingEntryById(id);
    if (!localEntry) return null;

    const result = {
      local: {
        ...localEntry,
      },
      server: null,
      isSynced: localEntry.synced || false
    };

    // If entry is synced and we're online, fetch server data via API call
    if (localEntry.synced && localEntry.server_id && isOnline) {
      try {
        console.log('Fetching server data for overthinking entry:', localEntry.server_id);
        const serverData = await getOverthinkingEntryFromServer(localEntry.server_id);
        if (serverData) {
          result.server = {
            createdAt: serverData.createdAt,
            updatedAt: serverData.updatedAt,
            tags: serverData.tags || [],
            mood: serverData.mood || null,
            // AI-generated fields
            category: serverData.category,
            intensity: serverData.intensity,
            triggers: serverData.triggers || [],
            patterns: serverData.patterns || [],
            coping_strategies: serverData.coping_strategies || [],
            reframe: serverData.reframe,
            urgency: serverData.urgency,
          };
        }
      } catch (error) {
        console.warn('Failed to fetch server data:', error);
        // Continue without server data
      }
    }

    return result;
  };

  // Delete overthinking entry locally and from server
  const deleteOverthinkingEntryLocal = async ({ entry }) => {
    // Delete from local database first
    await deleteOverthinkingEntryById(entry.id);

    // If entry was synced, also delete from server
    if (entry.synced && entry.server_id) {
      try {
        await deleteOverthinkingEntry({ id: entry.server_id });
      } catch (serverError) {
        console.warn(
          "Failed to delete from server, but local deletion succeeded:",
          serverError
        );
      }
    }

    return true;
  };

  // Load entry data
  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      
      // First, load local data immediately
      const localEntry = await getOverthinkingEntryById(id);
      
      if (!localEntry) {
        Alert.alert("Entry Not Found", "This overthinking entry could not be found.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        return;
      }
      
      // Set up initial combined data with local entry
      const initialCombinedData = {
        local: localEntry,
        server: null,
        isSynced: localEntry.synced || false
      };
      
      // Set local data immediately
      setCombinedData(initialCombinedData);
      setEntry(localEntry);
      setEditTitle(localEntry.title || "");
      setEditThought(localEntry.thought || "");
      setEditSolution(localEntry.solution || "");
      setLoading(false); // Show UI with local data
      
      // If entry is synced, fetch server data in background
      if (localEntry.synced && localEntry.server_id && isOnline) {
        setLoadingServerData(true);
        try {
          console.log('Fetching server data for overthinking entry:', localEntry.server_id);
          const serverData = await getOverthinkingEntryFromServer(localEntry.server_id);
          
          if (serverData) {
            const updatedCombinedData = {
              ...initialCombinedData,
              server: {
                createdAt: serverData.createdAt,
                updatedAt: serverData.updatedAt,
                tags: serverData.tags || [],
                mood: serverData.mood || null,
                // AI-generated fields
                category: serverData.category,
                intensity: serverData.intensity,
                triggers: serverData.triggers || [],
                patterns: serverData.patterns || [],
                coping_strategies: serverData.coping_strategies || [],
                reframe: serverData.reframe,
                urgency: serverData.urgency,
              }
            };
            setCombinedData(updatedCombinedData);
          }
        } catch (error) {
          console.warn('Failed to fetch server data:', error);
        } finally {
          setLoadingServerData(false);
        }
      }
    } catch (error) {
      console.error("Error loading overthinking entry:", error);
      Alert.alert("Error", "Failed to load overthinking entry");
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(entry?.title || "");
    setEditThought(entry?.thought || "");
    setEditSolution(entry?.solution || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editThought.trim()) {
        Alert.alert("Error", "Thought content cannot be empty");
        return;
      }

      const updatedEntry = await updateOverthinkingEntryLocal({
        id: entry.id,
        title: editTitle.trim(),
        thought: editThought.trim(),
        solution: editSolution.trim()
      });

      setEntry(updatedEntry);
      setIsEditing(false);
      
      Alert.alert("Success", "Entry updated successfully!");
      
      // Try to sync if online
      if (isOnline) {
        try {
          setIsSyncing(true);
          const synced = await syncOverthinkingEntryToServer({ entry: updatedEntry });
          if (!synced) {
            Alert.alert("Sync Failed", "Entry saved locally but couldn't be synced. You can try again later.");
            return;
          } 
          await loadEntry(); // Refresh to show synced status
        } catch (syncError) {
          console.warn("Failed to sync updated entry:", syncError);
          Alert.alert(
            "Sync Failed", 
            "Entry updated locally but couldn't be synced. You can try syncing manually later."
          );
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (error) {
      console.error("Error updating overthinking entry:", error);
      Alert.alert("Error", error.message || "Failed to update entry");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this overthinking entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOverthinkingEntryLocal({ entry });
              Alert.alert("Success", "Entry deleted successfully!", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Error", "Failed to delete entry");
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    if (!entry || entry.synced) return;
    
    if (!isOnline) {
      Alert.alert(
        "No Internet Connection",
        "Please check your connection and try again."
      );
      return;
    }
    
    try {
      // Check daily sync limit
      const canSync = await canSyncOverthinkingToday();
      if (!canSync) {
        Alert.alert(
          "Sync Limit Reached",
          "You can only sync 3 times per day. Try again tomorrow."
        );
        return;
      }
      
      setIsSyncing(true);
      
      const synced = await syncOverthinkingEntryToServer({ entry });
      
      if (!synced) {
        Alert.alert("Sync Failed", "Failed to sync entry. Please try again later.");
        return;
      }
      await loadEntry(); // Refresh to show synced status
      
      Alert.alert("Success", "Entry synced to cloud successfully!");
    } catch (error) {
      console.error("Error syncing entry:", error);
      Alert.alert(
        "Sync Failed",
        error.message || "Failed to sync entry. Please try again later."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = async () => {
    if (!entry) return;
    
    try {
      const shareContent = `${entry.title ? `${entry.title}\n\n` : ''}Thought: ${entry.thought}${entry.solution ? `\n\nSolution: ${entry.solution}` : ''}`;
      await Share.share({
        message: shareContent,
        title: entry.title || "Overthinking Entry"
      });
    } catch (error) {
      console.error("Error sharing entry:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading entry...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Entry not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Entry" : "Overthinking Entry"}
        </Text>
        
        <View style={styles.headerActions}>
          {!isEditing && (
            <>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, { marginLeft: 4 }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          
          {isEditing && (
            <>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {combinedData && combinedData.isSynced ? (
        /* Scrollable View for Synced Entries with Flexible Sections */
        <ScrollView style={styles.syncedScrollView} showsVerticalScrollIndicator={false}>
          {/* Device Data Section */}
          <View style={styles.deviceSection}>
            <View style={styles.simpleHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.deviceDot} />
                <Text style={styles.simpleHeaderTitle}>Device</Text>
              </View>
              <Text style={styles.headerDate}>{formatDate(combinedData.local.created_at)}</Text>
            </View>
            
            <View style={styles.flexibleContentArea}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.titleInput}
                    placeholder="Title (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={editTitle}
                    onChangeText={setEditTitle}
                    maxLength={200}
                  />
                  
                  <TextInput
                    style={styles.contentInput}
                    placeholder="What are you overthinking about?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={8}
                    value={editThought}
                    onChangeText={setEditThought}
                    textAlignVertical="top"
                    autoFocus
                  />
                  
                  <TextInput
                    style={styles.solutionInput}
                    placeholder="Potential solution (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={editSolution}
                    onChangeText={setEditSolution}
                    textAlignVertical="top"
                  />
                </View>
              ) : (
                <View style={styles.contentDisplay}>
                  {combinedData.local.title && (
                    <Text style={styles.displayTitle}>{combinedData.local.title}</Text>
                  )}
                  <Text style={styles.displayContent}>{combinedData.local.thought}</Text>
                  {combinedData.local.solution && (
                    <View style={styles.solutionDisplay}>
                      <Text style={styles.solutionLabel}>Your Solution:</Text>
                      <Text style={styles.solutionText}>{combinedData.local.solution}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          
          {/* Divider */}
          <View style={styles.simpleDivider} />
          
          {/* Cloud Data Section */}
          <View style={styles.cloudSection}>
            <View style={styles.simpleHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.cloudDot} />
                <Text style={styles.simpleHeaderTitle}>Cloud</Text>
              </View>
              <Text style={styles.headerDate}>
                {combinedData.server ? formatDate(combinedData.server.createdAt) : 'Unavailable'}
              </Text>
            </View>
            
            <View style={styles.flexibleContentArea}>
              {loadingServerData ? (
                <View style={styles.loadingServerContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.loadingServerText}>Loading AI insights...</Text>
                </View>
              ) : combinedData.server ? (
                <View style={styles.contentDisplay}>
                  {/* Category and Intensity */}
                  <View style={styles.metadataRow}>
                    {combinedData.server.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {combinedData.server.category.charAt(0).toUpperCase() + combinedData.server.category.slice(1)}
                        </Text>
                      </View>
                    )}
                    {combinedData.server.intensity && (
                      <View style={styles.intensityBadge}>
                        <Ionicons name="flash" size={12} color="#FFFFFF" />
                        <Text style={styles.intensityText}>
                          {combinedData.server.intensity}/10
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Triggers */}
                  {combinedData.server.triggers && combinedData.server.triggers.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>🔍 Triggers</Text>
                      {combinedData.server.triggers.map((trigger, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{trigger}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Thought Patterns */}
                  {combinedData.server.patterns && combinedData.server.patterns.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>🧠 Thought Patterns</Text>
                      {combinedData.server.patterns.map((pattern, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{pattern}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Coping Strategies */}
                  {combinedData.server.coping_strategies && combinedData.server.coping_strategies.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>💪 Coping Strategies</Text>
                      {combinedData.server.coping_strategies.map((strategy, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{strategy}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Reframe */}
                  {combinedData.server.reframe && (
                    <View style={styles.reframeSection}>
                      <Text style={styles.insightTitle}>🔄 Reframe</Text>
                      <Text style={styles.reframeText}>{combinedData.server.reframe}</Text>
                    </View>
                  )}
                  
                  {/* Urgency Level */}
                  {combinedData.server.urgency && (
                    <View style={styles.urgencyRow}>
                      <View style={[styles.urgencyBadge, 
                        combinedData.server.urgency === 'high' && styles.urgencyHigh,
                        combinedData.server.urgency === 'medium' && styles.urgencyMedium,
                        combinedData.server.urgency === 'low' && styles.urgencyLow
                      ]}>
                        <Ionicons 
                          name={combinedData.server.urgency === 'high' ? 'warning' : combinedData.server.urgency === 'medium' ? 'time' : 'checkmark-circle'} 
                          size={12} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.urgencyText}>
                          {combinedData.server.urgency.charAt(0).toUpperCase() + combinedData.server.urgency.slice(1)} Urgency
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : combinedData.isSynced ? (
                <View style={styles.unavailableContainer}>
                  <Ionicons name="cloud-offline" size={32} color="#94A3B8" />
                  <Text style={styles.unavailableTitle}>No Data</Text>
                  <Text style={styles.unavailableText}>Server data unavailable</Text>
                </View>
              ) : (
                <View style={styles.unavailableContainer}>
                  <Ionicons name="sync-outline" size={32} color="#94A3B8" />
                  <Text style={styles.unavailableTitle}>Not Synced</Text>
                  <Text style={styles.unavailableText}>Sync to get AI insights</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Original Single View Layout for Non-Synced Entries */
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Entry Info */}
          <View style={styles.entryInfo}>
            <Text style={styles.entryDate}>
              {formatDate(entry.created_at)}
            </Text>
            
            <View style={styles.statusRow}>
              <View style={styles.syncStatusContainer}>
                {entry.synced ? (
                  <View style={styles.syncStatus}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.syncedText}>Synced</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.syncStatus} 
                    onPress={handleSync}
                    disabled={isSyncing}
                  >
                    <Ionicons 
                      name={isSyncing ? "sync-outline" : "cloud-upload-outline"} 
                      size={16} 
                      color={isSyncing ? "#9CA3AF" : "#8B5CF6"} 
                    />
                    <Text style={styles.unsyncedText}>
                      {isSyncing ? "Syncing..." : "Tap to sync"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Entry Content */}
          <View style={styles.entryContent}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Title (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  maxLength={200}
                />
                
                <TextInput
                  style={styles.contentInput}
                  placeholder="What are you overthinking about?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={12}
                  value={editThought}
                  onChangeText={setEditThought}
                  textAlignVertical="top"
                  autoFocus
                />

                <TextInput
                  style={styles.solutionInput}
                  placeholder="Potential solution (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  value={editSolution}
                  onChangeText={setEditSolution}
                  textAlignVertical="top"
                />
              </>
            ) : (
              <>
                {entry.title && (
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                )}
                <Text style={styles.entryText}>{entry.thought}</Text>
                {entry.solution && (
                  <View style={styles.solutionDisplay}>
                    <Text style={styles.solutionLabel}>Your Solution:</Text>
                    <Text style={styles.solutionText}>{entry.solution}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Not Synced Warning */}
          {!entry.synced && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={20} color="#8B5CF6" />
              <Text style={styles.warningText}>
                This entry hasn't been synced to the cloud yet. {isOnline ? "Tap the sync button above to save it online." : "Connect to the internet to sync."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  entryInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  entryDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  syncStatusContainer: {
    alignItems: "flex-end",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: 6,
  },
  syncedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  unsyncedText: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  entryContent: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    minHeight: 300,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    padding: 0,
    textAlignVertical: "top",
  },
  contentInput: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    padding: 0,
    textAlignVertical: "top",
    minHeight: 200,
    marginBottom: 16,
  },
  solutionInput: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    padding: 0,
    textAlignVertical: "top",
    minHeight: 100,
  },
  entryTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    lineHeight: 28,
  },
  entryText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  solutionDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5F3FF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#5B21B6",
    lineHeight: 20,
  },
  // Scrollable view styles for flexible sections
  syncedScrollView: {
    flex: 1,
  },
  deviceSection: {
    backgroundColor: "#FFFFFF",
  },
  cloudSection: {
    backgroundColor: "#FAFAFA",
  },
  simpleDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  simpleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
  },
  cloudDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  simpleHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  flexibleContentArea: {
    minHeight: 100,
  },
  editContainer: {
    padding: 20,
  },
  contentDisplay: {
    padding: 20,
  },
  displayTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 26,
  },
  displayContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  unavailableContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
    marginBottom: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  loadingServerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingServerText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    fontFamily: "SpaceGrotesk-Medium",
  },
  
  // AI Insights styles
  metadataRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  intensityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  intensityText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  insightSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  insightPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#6B7280",
    marginRight: 12,
    marginTop: 2,
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  reframeSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0EA5E9",
  },
  reframeText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  urgencyRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});