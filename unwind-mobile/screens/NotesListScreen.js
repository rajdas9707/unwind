import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Animated,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { getAllNotes, searchNotes } from "../storage/notes/db";

const { width } = Dimensions.get("window");

export default function NotesListScreen() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [fabScale] = useState(new Animated.Value(1));

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  /**
   * Load all notes from database
   */
  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await getAllNotes();
      setNotes(allNotes);
      setFilteredNotes(allNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search query changes
   */
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredNotes(notes);
      return;
    }

    try {
      const results = await searchNotes(query);
      setFilteredNotes(results);
    } catch (error) {
      console.error("Error searching notes:", error);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  /**
   * Animate FAB button
   */
  const animateFAB = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Render individual note card
   */
  const renderNoteCard = ({ item }) => {
    // Get first image attachment for thumbnail
    const imageAttachment = item.attachments.find(
      (att) => att.type === "image"
    );

    // Get PDF attachments count
    const pdfCount = item.attachments.filter(
      (att) => att.type === "pdf"
    ).length;
    const imageCount = item.attachments.filter(
      (att) => att.type === "image"
    ).length;

    // Create content preview (first 100 characters)
    const contentPreview = item.content
      ? item.content.substring(0, 100) +
        (item.content.length > 100 ? "..." : "")
      : "No content";

    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => router.push(`/notes/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.noteCardContent}>
          {/* Left side: Text content */}
          <View style={styles.noteTextContainer}>
            <Text style={styles.noteTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.noteContent} numberOfLines={3}>
              {contentPreview}
            </Text>

            <View style={styles.noteFooter}>
              <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>

              {/* Attachment indicators */}
              {(imageCount > 0 || pdfCount > 0) && (
                <View style={styles.attachmentIndicators}>
                  {imageCount > 0 && (
                    <View style={styles.attachmentBadge}>
                      <Ionicons name="image" size={12} color="#3B82F6" />
                      <Text style={styles.attachmentCount}>{imageCount}</Text>
                    </View>
                  )}
                  {pdfCount > 0 && (
                    <View style={styles.attachmentBadge}>
                      <Ionicons name="document" size={12} color="#EF4444" />
                      <Text style={styles.attachmentCount}>{pdfCount}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Tags */}
            {item.tags && item.tags.trim() !== "" && (
              <View style={styles.tagsContainer}>
                {item.tags
                  .split(",")
                  .slice(0, 3)
                  .map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag.trim()}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Right side: Thumbnail if image exists */}
          {imageAttachment && (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: imageAttachment.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? "No notes match your search"
          : "Tap the + button to create your first note"}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Notes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadNotes}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            animateFAB();
            router.push("/notes/new");
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#8B5CF6", "#6D28D9"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteCardContent: {
    flexDirection: "row",
  },
  noteTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  attachmentIndicators: {
    flexDirection: "row",
    gap: 8,
  },
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  attachmentCount: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "500",
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
