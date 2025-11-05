import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Camera } from "expo-camera";
import * as Sharing from "expo-sharing";
import {
  insertNote,
  updateNote,
  getNoteById,
  deleteNoteById,
} from "../storage/notes/db";

const { width } = Dimensions.get("window");

export default function NoteEditorScreen() {
  const params = useLocalSearchParams();
  const noteId = params.id !== "new" ? parseInt(params.id) : null;

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [attachments, setAttachments] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Auto-save timer
  const autoSaveTimer = useRef(null);

  /**
   * Load note if editing existing note
   */
  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  /**
   * Auto-save after 2 seconds of inactivity
   */
  useEffect(() => {
    if (isEditing && noteId) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      // Set new timer for auto-save
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true);
      }, 2000);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, tags, attachments, isEditing]);

  /**
   * Load existing note from database
   */
  const loadNote = async () => {
    try {
      setLoading(true);
      const note = await getNoteById(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content || "");
        setTags(note.tags || "");
        setAttachments(note.attachments || []);
      }
    } catch (error) {
      console.error("Error loading note:", error);
      Alert.alert("Error", "Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle save or update note
   */
  const handleSave = async (isAutoSave = false) => {
    // Validate title
    if (!title.trim()) {
      if (!isAutoSave) {
        Alert.alert("Error", "Please enter a title for your note");
      }
      return;
    }

    try {
      setSaving(true);

      if (noteId) {
        // Update existing note
        await updateNote({
          id: noteId,
          title: title.trim(),
          content: content.trim(),
          attachments,
          tags: tags.trim(),
        });

        if (!isAutoSave) {
          Alert.alert("Success", "Note updated successfully");
          router.back();
        }
      } else {
        // Create new note
        const newNote = await insertNote({
          title: title.trim(),
          content: content.trim(),
          attachments,
          tags: tags.trim(),
        });

        Alert.alert("Success", "Note created successfully");
        router.replace(`/notes/${newNote.id}`);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving note:", error);
      if (!isAutoSave) {
        Alert.alert("Error", "Failed to save note");
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle delete note
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNoteById(noteId);
              Alert.alert("Success", "Note deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Error", "Failed to delete note");
            }
          },
        },
      ]
    );
  };

  /**
   * Take photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required to take photos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachment = {
          type: "image",
          uri: result.assets[0].uri,
        };
        setAttachments([...attachments, newAttachment]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  /**
   * Pick image from gallery
   */
  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Media library permission is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map((asset) => ({
          type: "image",
          uri: asset.uri,
        }));
        setAttachments([...attachments, ...newAttachments]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  /**
   * Pick PDF document
   */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map((asset) => ({
          type: "pdf",
          uri: asset.uri,
          name: asset.name,
        }));
        setAttachments([...attachments, ...newAttachments]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  /**
   * Remove attachment
   */
  const handleRemoveAttachment = (index) => {
    Alert.alert(
      "Remove Attachment",
      "Are you sure you want to remove this attachment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const newAttachments = attachments.filter((_, i) => i !== index);
            setAttachments(newAttachments);
            setIsEditing(true);
          },
        },
      ]
    );
  };

  /**
   * View PDF attachment
   */
  const handleViewPDF = async (attachment) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(attachment.uri);
      } else {
        Alert.alert("Not Supported", "PDF viewing is not supported on this device");
      }
    } catch (error) {
      console.error("Error viewing PDF:", error);
      Alert.alert("Error", "Failed to open PDF");
    }
  };

  /**
   * Render attachment item
   */
  const renderAttachment = (attachment, index) => {
    if (attachment.type === "image") {
      return (
        <View key={index} style={styles.attachmentItem}>
          <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
          <TouchableOpacity
            style={styles.removeAttachmentButton}
            onPress={() => handleRemoveAttachment(index)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      );
    } else if (attachment.type === "pdf") {
      return (
        <TouchableOpacity
          key={index}
          style={styles.pdfAttachmentItem}
          onPress={() => handleViewPDF(attachment)}
        >
          <View style={styles.pdfIcon}>
            <Ionicons name="document-text" size={32} color="#EF4444" />
          </View>
          <View style={styles.pdfInfo}>
            <Text style={styles.pdfName} numberOfLines={1}>
              {attachment.name || "PDF Document"}
            </Text>
            <Text style={styles.pdfLabel}>Tap to view</Text>
          </View>
          <TouchableOpacity
            style={styles.removePdfButton}
            onPress={() => handleRemoveAttachment(index)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{noteId ? "Edit Note" : "New Note"}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#8B5CF6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note Title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setIsEditing(true);
            }}
            maxLength={100}
          />
        </View>

        {/* Content Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.contentInput}
            placeholder="Start writing your note..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={(text) => {
              setContent(text);
              setIsEditing(true);
            }}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Tags Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="pricetag" size={20} color="#6B7280" />
            <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
          </View>
          <TextInput
            style={styles.tagsInput}
            placeholder="e.g., work, ideas, todo"
            placeholderTextColor="#9CA3AF"
            value={tags}
            onChangeText={(text) => {
              setTags(text);
              setIsEditing(true);
            }}
          />
        </View>

        {/* Attachment Buttons */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="attach" size={20} color="#6B7280" />
            <Text style={styles.inputLabel}>Attachments</Text>
          </View>
          <View style={styles.attachmentButtons}>
            <TouchableOpacity style={styles.attachmentButton} onPress={handleTakePhoto}>
              <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.buttonGradient}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentButton} onPress={handlePickImage}>
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.buttonGradient}>
                <Ionicons name="image" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Add Image</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentButton} onPress={handlePickDocument}>
              <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.buttonGradient}>
                <Ionicons name="document" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Attach PDF</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <View style={styles.inputSection}>
            <Text style={styles.attachmentsTitle}>
              Attachments ({attachments.length})
            </Text>
            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment, index) => renderAttachment(attachment, index))}
            </View>
          </View>
        )}

        {/* Delete Button (only for existing notes) */}
        {noteId && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Note</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    minHeight: 200,
    padding: 0,
  },
  tagsInput: {
    fontSize: 14,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    minWidth: (width - 64) / 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  attachmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attachmentItem: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  removeAttachmentButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  pdfAttachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  pdfLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  removePdfButton: {
    padding: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
});
