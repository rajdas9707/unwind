import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  createCustomList,
  updateCustomListData,
  LIST_COLORS,
} from "../../storage/customLists/storage";

export default function CreateEditListScreen() {
  const params = useLocalSearchParams();
  const isEditMode = !!params.listId;

  const [title, setTitle] = useState(params.title || "");
  const [description, setDescription] = useState(params.description || "");
  const [selectedColor, setSelectedColor] = useState(params.color || LIST_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Validation
  const isValidForm = title.trim().length > 0 && title.trim().length <= 100;

  // Handle save
  const handleSave = async () => {
    if (saving || !isValidForm) return;

    setSaving(true);
    try {
      if (isEditMode) {
        await updateCustomListData({
          id: parseInt(params.listId),
          title: title.trim(),
          description: description.trim(),
          color: selectedColor,
        });
      } else {
        await createCustomList({
          title: title.trim(),
          description: description.trim(),
          color: selectedColor,
        });
      }
      router.back();
    } catch (error) {
      console.error("Error saving list:", error);
      Alert.alert("Error", error.message || "Failed to save list");
    } finally {
      setSaving(false);
    }
  };

  // Render color swatch
  const renderColorSwatch = (color) => {
    const isSelected = color === selectedColor;
    return (
      <TouchableOpacity
        key={color}
        style={[
          styles.colorSwatch,
          { backgroundColor: color },
          isSelected && styles.colorSwatchSelected,
        ]}
        onPress={() => setSelectedColor(color)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit List" : "New List"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* List Name */}
            <View style={styles.section}>
              <Text style={styles.label}>
                List Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter list name"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                autoFocus={!isEditMode}
                returnKeyType="next"
              />
              <Text style={styles.helperText}>
                {title.length}/100 characters
              </Text>
            </View>

            {/* Color Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {LIST_COLORS.map(renderColorSwatch)}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a description for this list"
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
              />
              <Text style={styles.helperText}>
                {description.length}/500 characters
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: selectedColor },
              (!isValidForm || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValidForm || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? "Save Changes" : "Create List"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: "#111827",
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
