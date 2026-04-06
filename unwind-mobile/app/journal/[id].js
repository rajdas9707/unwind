import React, { useState, useEffect, useContext } from "react";
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
  Share,
  BackHandler,
} from "react-native";
// Removed animation imports
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNetworkStatus } from "../../utils/networkUtils";
// import { useDatabaseReady } from "../../hooks/useDatabaseReady";

// Import storage layer (backend-only)
import {
  fetchJournalEntryById,
  updateJournalEntryLocal,
  deleteJournalEntryLocal,
} from "../../storage/journal/storage";
import { updateJournalEntry } from "../../api/journal";
import SavingOverlay from "../../components/SavingOverlay";

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  // const { isReady } = useDatabaseReady();
  const isOnline = useNetworkStatus();
  
  const [entry, setEntry] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingServerData, setLoadingServerData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [editInfo, setEditInfo] = useState(null); // Track edit limit info
  const [isSaving, setIsSaving] = useState(false); // Track save operation
  
  // Removed animation logic


  // Prevent back navigation when saving
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSaving) {
        Alert.alert(
          "Saving in Progress",
          "Please wait while your changes are being saved.",
          [{ text: "OK" }]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    });

    return () => backHandler.remove();
  }, [isSaving]);

  // Load entry data
  useEffect(() => {
    if ( id) {
      loadEntry();
    }
  }, [ id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      // Load entry from backend
      const entryData = await fetchJournalEntryById(id);
      
      if (!entryData) {
        Alert.alert("Entry Not Found", "This journal entry could not be found.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        return;
      }
      
      setEntry(entryData);
      setEditContent(entryData.content || "");
      setCombinedData({ local: entryData, server: entryData, isSynced: true });
    } catch (error) {
      console.error("Error loading journal entry:", error);
      Alert.alert("Error", "Failed to load journal entry");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Check if this is today's journal entry
    const today = new Date().toISOString().split('T')[0];
    const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
    
    if (entryDate !== today) {
      Alert.alert(
        "Cannot Edit Past Entries",
        "You can only edit today's journal entry. Past entries cannot be modified.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(entry?.content || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    try {
      if (!editContent.trim()) {
        Alert.alert("Error", "Journal content cannot be empty");
        return;
      }

      setIsSaving(true); // Start saving state - locks the screen

      // Update via backend
      const updatedEntry = await updateJournalEntryLocal({
        id: entry.id,
        title: entry.title,
        content: editContent.trim()
      });

      setEntry(updatedEntry);
      await loadEntry();
      Alert.alert("Success", "Entry updated successfully!");
      
      // Only exit edit mode after everything is complete
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      Alert.alert("Error", error.message || "Failed to update entry");
    } finally {
      setIsSaving(false); // Always clear saving state
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from backend
              await deleteJournalEntryLocal({ entry });
              Alert.alert("Success", "Entry deleted successfully!", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Error", error.message || "Failed to delete entry");
            }
          },
        },
      ]
    );
  };


  const handleShare = async () => {
    if (!entry) return;
    
    try {
      const shareContent = `${entry.title ? `${entry.title}\n\n` : ''}${entry.content}`;
      await Share.share({
        message: shareContent,
        title: entry.title || "Journal Entry"
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
        <ActivityIndicator size="large" color="#3B82F6" />
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
      
      {/* Saving Overlay - Locks the screen during save */}
      <SavingOverlay 
        visible={isSaving} 
        message="Saving changes..."
        submessage="Please don't navigate away"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.headerButton, isSaving && styles.disabledButton]} 
          onPress={() => {
            if (isSaving) {
              Alert.alert(
                "Saving in Progress",
                "Please wait while your changes are being saved.",
                [{ text: "OK" }]
              );
            } else {
              router.back();
            }
          }}
          disabled={isSaving}
        >
          <Ionicons name="arrow-back" size={24} color={isSaving ? "#D1D5DB" : "#111827"} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Entry" : "Journal Entry"}
          </Text>
          {entry?.synced && editInfo && editInfo.remainingEdits !== null && (
            <Text style={styles.editLimitText}>
              {editInfo.remainingEdits} {editInfo.remainingEdits === 1 ? 'edit' : 'edits'} left today
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {!isEditing && (
            <>
              <TouchableOpacity 
                style={[styles.headerButton, isSaving && styles.disabledButton]} 
                onPress={handleShare}
                disabled={isSaving}
              >
                <Ionicons name="share-outline" size={20} color={isSaving ? "#D1D5DB" : "#6B7280"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, isSaving && styles.disabledButton]} 
                onPress={handleEdit}
                disabled={isSaving}
              >
                <Ionicons 
                  name="create-outline" 
                  size={20} 
                  color={isSaving ? "#D1D5DB" : (new Date(entry.created_at).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? "#6B7280" : "#D1D5DB")} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, { marginLeft: 4 }, isSaving && styles.disabledButton]}
                onPress={handleDelete}
                disabled={isSaving}
              >
                <Ionicons name="trash-outline" size={20} color={isSaving ? "#D1D5DB" : "#EF4444"} />
              </TouchableOpacity>
            </>
          )}
          
          {isEditing && (
            <>
              <TouchableOpacity 
                style={[styles.headerButton, isSaving && styles.disabledButton]} 
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={[styles.cancelButtonText, isSaving && styles.disabledText]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.savingButton]} 
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
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
                    style={styles.contentInput}
                    placeholder="What's on your mind?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={12}
                    value={editContent}
                    onChangeText={setEditContent}
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
              ) : (
                <View style={styles.contentDisplay}>
                  {combinedData.local.title && (
                    <Text style={styles.displayTitle}>{combinedData.local.title}</Text>
                  )}
                  <Text style={styles.displayContent}>{combinedData.local.content}</Text>
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
                  {combinedData.server.title && (
                    <Text style={styles.displayTitle}>{combinedData.server.title}</Text>
                  )}
                  
                  {/* Display structured AI-processed content */}
                  {combinedData.server.rating && (
                    <View style={styles.ratingSection}>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>★ {combinedData.server.rating}/10</Text>
                      </View>
                      <Text style={styles.ratingLabel}>Day Rating</Text>
                    </View>
                  )}
                  
                  {/* Summary Points */}
                  {combinedData.server.summary && combinedData.server.summary.length > 0 && (
                    <View style={styles.summarySection}>
                      <Text style={styles.sectionTitle}>Summary</Text>
                      {combinedData.server.summary.map((point, index) => (
                        <View key={index} style={styles.summaryPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Positives */}
                  {combinedData.server.positives && combinedData.server.positives.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>😊 Positives</Text>
                      {combinedData.server.positives.map((positive, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{positive}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Negatives/Challenges */}
                  {combinedData.server.negatives && combinedData.server.negatives.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>⚠️ Challenges</Text>
                      {combinedData.server.negatives.map((negative, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{negative}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Lessons */}
                  {combinedData.server.lessons && combinedData.server.lessons.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightTitle}>💡 Lessons Learned</Text>
                      {combinedData.server.lessons.map((lesson, index) => (
                        <View key={index} style={styles.insightPoint}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.pointText}>{lesson}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {(combinedData.server.tags?.length > 0 || combinedData.server.mood) && (
                    <View style={styles.extraInfo}>
                      {combinedData.server.tags?.length > 0 && (
                        <Text style={styles.tags}>Tags: {combinedData.server.tags.join(", ")}</Text>
                      )}
                      {combinedData.server.mood && (
                        <Text style={styles.mood}>Mood: {combinedData.server.mood}</Text>
                      )}
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
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentEmoji}>{entry.sentiment}</Text>
                <Text style={styles.sentimentLabel}>Mood</Text>
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
            {isEditing ? (
              <TextInput
                style={styles.contentInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={20}
                value={editContent}
                onChangeText={setEditContent}
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <>
                {entry.title && (
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                )}
                <Text style={styles.entryText}>{entry.content}</Text>
              </>
            )}
          </View>

          {/* Server Meta Info (if synced) - Keep for backward compatibility */}
          {entry.synced && entry.server_meta && (
            <View style={styles.serverMetaContainer}>
              <Text style={styles.serverMetaTitle}>Cloud Information</Text>
              
              <View style={styles.serverMetaRow}>
                <Ionicons name="cloud" size={16} color="#6B7280" />
                <Text style={styles.serverMetaText}>
                  Synced to cloud on {formatDate(entry.server_meta.updatedAt)}
                </Text>
              </View>
              
              {entry.server_meta.tags && entry.server_meta.tags.length > 0 && (
                <View style={styles.serverMetaRow}>
                  <Ionicons name="pricetags" size={16} color="#6B7280" />
                  <Text style={styles.serverMetaText}>
                    Tags: {entry.server_meta.tags.join(", ")}
                  </Text>
                </View>
              )}
              
              {entry.server_meta.mood && (
                <View style={styles.serverMetaRow}>
                  <Ionicons name="happy" size={16} color="#6B7280" />
                  <Text style={styles.serverMetaText}>
                    Server mood: {entry.server_meta.mood}
                  </Text>
                </View>
              )}
            </View>
          )}

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
    backgroundColor: "#3B82F6",
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
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  editLimitText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
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
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  savingButton: {
    backgroundColor: "#9CA3AF",
    opacity: 0.8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
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
  sentimentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sentimentEmoji: {
    fontSize: 24,
  },
  sentimentLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  syncStatusContainer: {
    flex: 1,
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
  serverMetaContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serverMetaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  serverMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  serverMetaText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
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
    backgroundColor: "#3B82F6",
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
  contentArea: {
    flex: 1,
  },
  flexibleContentArea: {
    // Flexible content area that takes as much space as needed
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
  extraInfo: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tags: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  mood: {
    fontSize: 13,
    color: "#6B7280",
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
  
  // Structured content styles for cloud data
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  summaryPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
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
  insightSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
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
});
