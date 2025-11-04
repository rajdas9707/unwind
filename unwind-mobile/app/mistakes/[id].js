import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  fetchMistakesEntryById,
  canSyncMistakesToday,
  getMistakeCategories,
  getCategoryColor,
  getCategoryEmoji,
} from "../../storage/mistakes/storage";

// Import API client functions
import {
  createMistakeEntry,
  deleteMistakeEntry,
  listMistakesEntries,
} from "../../api/mistakes";

// Add a function to get mistake entry by server ID
const getMistakeEntryFromServer = async (serverId) => {
  try {
    // Fetch the specific entry from server using list API with server ID
    const response = await listMistakesEntries({ limit: 100 });
    // Note: You might need to implement a specific getMistakeEntry API endpoint
    // For now, we'll work with the existing API structure
    return response?.entries?.find(entry => entry._id === serverId) || null;
  } catch (error) {
    console.error('Error fetching server mistake entry:', error);
    return null;
  }
};

// Import database operations
import {
  getMistakesEntryById,
  markMistakesEntrySynced,
  deleteMistakesEntryById,
} from "../../storage/mistakes/db";

export default function MistakesDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  
  const [entry, setEntry] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingServerData, setLoadingServerData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync single mistake entry to server
  const syncMistakeEntryToServer = async ({ entry }) => {
    if (entry.synced) {
      return entry; // Already synced
    }

    // Create entry on server
    const serverEntry = await createMistakeEntry({
      description: entry.description || entry.mistake,
      category: entry.category,
      learning: entry.learning,
      date: entry.created_at.split("T")[0],
    });

    console.log("Server entry created:", serverEntry);
    if (!serverEntry || !serverEntry._id) {
      return null;
    }

    // Mark as synced locally - store AI-generated fields in server_meta
    const syncedEntry = await markMistakesEntrySynced({
      id: entry.id,
      server_id: serverEntry._id,
      server_meta: {
        createdAt: serverEntry.createdAt,
        updatedAt: serverEntry.updatedAt,
        tags: serverEntry.tags || [],
        category: serverEntry.category || entry.category,
        // AI-generated fields from server (with fallbacks)
        solution: serverEntry.solution || null,
        learning: serverEntry.learning || null,
        intensity: serverEntry.intensity || null,
        prevention_strategies: Array.isArray(serverEntry.prevention_strategies) ? serverEntry.prevention_strategies : [],
        root_causes: Array.isArray(serverEntry.root_causes) ? serverEntry.root_causes : [],
        next_steps: Array.isArray(serverEntry.next_steps) ? serverEntry.next_steps : [],
      },
    });

    return syncedEntry;
  };

  // Get local data for a mistake entry
  const fetchMistakeEntryLocal = async (id) => {
    const localEntry = await getMistakesEntryById(id);
    if (!localEntry) return null;

    return {
      local: {
        ...localEntry,
      },
      server: null,
      isSynced: localEntry.synced || false
    };
  };

  // Fetch server data separately
  const fetchMistakeServerData = async (serverId) => {
    setLoadingServerData(true);
    try {
      console.log('Fetching server data for mistake entry:', serverId);
      const serverData = await getMistakeEntryFromServer(serverId);
      if (serverData) {
        return {
          createdAt: serverData.createdAt,
          updatedAt: serverData.updatedAt,
          tags: serverData.tags || [],
          category: serverData.category,
          // AI-generated fields
          solution: serverData.solution,
          learning: serverData.learning,
          intensity: serverData.intensity,
          prevention_strategies: serverData.prevention_strategies || [],
          root_causes: serverData.root_causes || [],
          next_steps: serverData.next_steps || [],
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch server data:', error);
      return null;
    } finally {
      setLoadingServerData(false);
    }
  };

  // Delete mistake entry locally and from server
  const deleteMistakeEntryLocal = async ({ entry }) => {
    // Delete from local database first
    await deleteMistakesEntryById(entry.id);

    // If entry was synced, also delete from server
    if (entry.synced && entry.server_id) {
      try {
        await deleteMistakeEntry({ id: entry.server_id });
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
      
      // First load local data only
      const localData = await fetchMistakeEntryLocal(id);
      
      if (!localData) {
        Alert.alert("Entry Not Found", "This mistake entry could not be found.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        return;
      }
      
      // Set local data immediately so UI can render
      const entryData = localData.local;
      setCombinedData(localData);
      setEntry(entryData);
      setLoading(false); // Stop main loading
      
      // If entry is synced, fetch server data separately in the background
      if (localData.isSynced && entryData.server_id && isOnline) {
        const serverData = await fetchMistakeServerData(entryData.server_id);
        if (serverData) {
          // Update combined data with server data
          setCombinedData(prev => ({
            ...prev,
            server: serverData
          }));
        }
      }
    } catch (error) {
      console.error("Error loading mistake entry:", error);
      Alert.alert("Error", "Failed to load mistake entry");
      setLoading(false);
    }
  };


  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this mistake entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMistakeEntryLocal({ entry });
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
      const canSync = await canSyncMistakesToday();
      if (!canSync) {
        Alert.alert(
          "Sync Limit Reached",
          "You can only sync 3 times per day. Try again tomorrow."
        );
        return;
      }
      
      setIsSyncing(true);
      
      const synced = await syncMistakeEntryToServer({ entry });
      
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
      const shareContent = `Mistake: ${entry.description || entry.mistake}${entry.learning ? `\n\nLearning: ${entry.learning}` : ''}`;
      await Share.share({
        message: shareContent,
        title: `${entry.category} Mistake`
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
        <ActivityIndicator size="large" color="#F59E0B" />
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
          Mistake Entry
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, { marginLeft: 4 }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
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
              <View style={styles.contentDisplay}>
                <View style={styles.categoryRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(combinedData.local.category) },
                    ]}
                  >
                    <Text style={styles.categoryBadgeEmoji}>
                      {getCategoryEmoji(combinedData.local.category)}
                    </Text>
                    <Text style={styles.categoryBadgeText}>
                      {combinedData.local.category.charAt(0).toUpperCase() +
                        combinedData.local.category.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.contentGroup}>
                  <Text style={styles.contentLabel}>What happened:</Text>
                  <Text style={styles.contentText}>{combinedData.local.description || combinedData.local.mistake}</Text>
                </View>
                
                {combinedData.local.learning && (
                  <View style={styles.contentGroup}>
                    <Text style={styles.contentLabel}>Personal reflection:</Text>
                    <Text style={styles.contentText}>{combinedData.local.learning}</Text>
                  </View>
                )}
              </View>
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
                  {/* Impact Level Badge */}
                  {combinedData.server.intensity && (
                    <View style={styles.metadataRow}>
                      <View style={styles.intensityBadge}>
                        <Ionicons name="warning" size={10} color="#FFFFFF" />
                        <Text style={styles.intensityText}>
                          {combinedData.server.intensity}/10
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* AI-Generated Solution */}
                  {combinedData.server.solution && (
                    <View style={styles.insightGroup}>
                      <Text style={styles.insightTitle}>💡 How to Improve</Text>
                      <Text style={styles.insightText}>{combinedData.server.solution}</Text>
                    </View>
                  )}
                  
                  {/* AI-Generated Learning */}
                  {(combinedData.server.learning && combinedData.server.learning !== combinedData.local.learning) && (
                    <View style={styles.insightGroup}>
                      <Text style={styles.insightTitle}>🎯 Key Learning</Text>
                      <Text style={styles.insightText}>{combinedData.server.learning}</Text>
                    </View>
                  )}
                  
                  {/* Prevention Strategies */}
                  {combinedData.server.prevention_strategies && Array.isArray(combinedData.server.prevention_strategies) && combinedData.server.prevention_strategies.length > 0 && (
                    <View style={styles.insightGroup}>
                      <Text style={styles.insightTitle}>🛡️ Prevention Strategies</Text>
                      {combinedData.server.prevention_strategies.map((strategy, index) => (
                        <Text key={index} style={styles.insightItem}>• {strategy}</Text>
                      ))}
                    </View>
                  )}
                  
                  {/* Root Causes */}
                  {combinedData.server.root_causes && Array.isArray(combinedData.server.root_causes) && combinedData.server.root_causes.length > 0 && (
                    <View style={styles.insightGroup}>
                      <Text style={styles.insightTitle}>🔍 Root Causes</Text>
                      {combinedData.server.root_causes.map((cause, index) => (
                        <Text key={index} style={styles.insightItem}>• {cause}</Text>
                      ))}
                    </View>
                  )}
                  
                  {/* Next Steps */}
                  {combinedData.server.next_steps && Array.isArray(combinedData.server.next_steps) && combinedData.server.next_steps.length > 0 && (
                    <View style={styles.insightGroup}>
                      <Text style={styles.insightTitle}>➡️ Next Steps</Text>
                      {combinedData.server.next_steps.map((step, index) => (
                        <Text key={index} style={styles.insightItem}>• {step}</Text>
                      ))}
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
              <View style={styles.categoryContainer}>
                <View
                  style={[
                    styles.categoryBadgeSmall,
                    { backgroundColor: getCategoryColor(entry.category) },
                  ]}
                >
                  <Text style={styles.categoryEmojiSmall}>
                    {getCategoryEmoji(entry.category)}
                  </Text>
                </View>
                <Text style={styles.categoryLabel}>{entry.category}</Text>
              </View>
              
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
                      color={isSyncing ? "#9CA3AF" : "#F59E0B"} 
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
            <Text style={styles.entryText}>{entry.description || entry.mistake}</Text>
            {entry.learning && (
              <View style={styles.learningDisplay}>
                <Text style={styles.learningLabel}>Personal Learning:</Text>
                <Text style={styles.learningText}>{entry.learning}</Text>
              </View>
            )}
          </View>

          {/* Not Synced Warning */}
          {!entry.synced && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
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
    backgroundColor: "#F59E0B",
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryEmojiSmall: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
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
    color: "#F59E0B",
    fontWeight: "500",
  },
  entryContent: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    minHeight: 300,
  },
  entryText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  learningDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#EBF5FF",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  learningLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  learningText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
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
    backgroundColor: "#F59E0B",
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
  contentDisplay: {
    padding: 20,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryBadgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  contentGroup: {
    marginBottom: 16,
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 4,
  },
  contentText: {
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
  intensityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  intensityText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 4,
  },
  insightGroup: {
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0EA5E9",
    marginBottom: 6,
  },
  insightText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  insightItem: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
});