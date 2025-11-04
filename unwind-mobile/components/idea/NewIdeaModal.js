import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert, FlatList } from "react-native";
import { saveFiles } from "../../storage/idea/storage";
import { insertIdea, updateIdea } from "../../storage/idea/db";
// import * as SpeechRecognizer from "expo-speech-recognition";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function NewIdeaModal({
  visible,
  onClose,
  onSave,
  ideaId,
  initialIdea,
}) {
  const [ideaName, setIdeaName] = useState(initialIdea?.name || "");
  const [newIdea, setNewIdea] = useState(initialIdea?.idea || "");
  const [selectedTag, setSelectedTag] = useState(
    initialIdea?.tag || "miscellaneous"
  );

  useEffect(() => {
    if (visible) {
      setIdeaName(initialIdea?.name || "");
      setNewIdea(initialIdea?.idea || "");
      setSelectedTag(initialIdea?.tag || "miscellaneous");
    }
  }, [visible]);

  const tags = ["miscellaneous", "Work", "Personal", "Startup"];

  const handleSave = async () => {
    if (!ideaName.trim()) {
      Alert.alert("Error", "Idea name is required");
      return;
    }
    if (!newIdea.trim()) {
      Alert.alert("Error", "Idea description cannot be empty");
      return;
    }

    try {
      // Ensure we have an id
      let id = ideaId;
      if (!id) {
        id = await insertIdea({
          name: ideaName.trim(),
          idea: newIdea.trim(),
          urls: [],
          files: [],
          tag: selectedTag,
          researchTopics: [],
        });
        console.log("Created new idea with ID:", id);
      } else {
        // Update existing idea
        await updateIdea({
          id,
          name: ideaName.trim(),
          idea: newIdea.trim(),
          urls: initialIdea?.urls || [],
          files: initialIdea?.files || [],
          tag: selectedTag,
          researchTopics: initialIdea?.researchTopics || [],
        });
        console.log("Updated idea with ID:", id);
      }

      onSave &&
        onSave({
          id,
          name: ideaName.trim(),
          idea: newIdea.trim(),
          tag: selectedTag,
        });

      // Reset state
      setIdeaName("");
      setNewIdea("");
      setSelectedTag("miscellaneous");
      onClose && onClose();
    } catch (error) {
      console.log("Error saving idea in IdeaModal:", error);
      Alert.alert("Error", "Failed to save idea");
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{ideaId ? "Edit Idea" : "New Idea"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

          {/* Idea Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Idea Name *</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Give your idea a name..."
              value={ideaName}
              onChangeText={setIdeaName}
              maxLength={100}
              autoFocus
            />
          </View>

          {/* Idea Description */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your idea in detail..."
              value={newIdea}
              onChangeText={setNewIdea}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Category Tags */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, selectedTag === tag && styles.activeTag]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTag === tag && { color: "#fff" },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{ideaId ? "Save" : "Create Idea"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    minHeight: 120,
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    marginRight: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  urlList: {
    marginTop: 8,
  },
  urlItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  urlIcon: {
    marginRight: 8,
  },
  urlText: {
    flex: 1,
    color: "#374151",
    fontSize: 14,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  photoButton: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 100,
  },
  photoText: {
    fontSize: 12,
    color: "#6366F1",
    marginTop: 4,
    fontWeight: "600",
  },
  filesList: {
    marginTop: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: "#6B7280",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#6366F1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  activeTag: {
    backgroundColor: "#6366F1",
  },
  tagText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
