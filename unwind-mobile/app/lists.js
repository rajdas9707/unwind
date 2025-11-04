import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  fetchAllCustomLists,
  deleteCustomList,
} from "../storage/customLists/storage";

export default function AllListsScreen() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load lists from storage
  const loadLists = async () => {
    try {
      const allLists = await fetchAllCustomLists();
      setLists(allLists);
    } catch (error) {
      console.error("Error loading lists:", error);
      Alert.alert("Error", "Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  // Refresh lists
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLists();
    setRefreshing(false);
  };

  // Focus effect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  // Navigate to create list screen
  const handleCreateList = () => {
    router.push("/lists/create");
  };

  // Navigate to list details
  const handleOpenList = (list) => {
    router.push({
      pathname: "/lists/[id]",
      params: { id: list.id, listName: list.title, listColor: list.color },
    });
  };

  // Navigate to edit list screen
  const handleEditList = (list) => {
    router.push({
      pathname: "/lists/create",
      params: {
        listId: list.id,
        title: list.title,
        description: list.description,
        color: list.color,
      },
    });
  };

  // Delete list with confirmation
  const handleDeleteList = (list) => {
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${list.title}"? All items in this list will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomList(list.id);
              await loadLists();
            } catch (error) {
              console.error("Error deleting list:", error);
              Alert.alert("Error", "Failed to delete list");
            }
          },
        },
      ]
    );
  };

  // Render list card
  const renderListCard = (list) => {
    return (
      <TouchableOpacity
        key={list.id}
        style={styles.listCard}
        onPress={() => handleOpenList(list)}
        activeOpacity={0.7}
      >
        <View style={[styles.colorBar, { backgroundColor: list.color }]} />
        
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <View style={[styles.colorCircle, { backgroundColor: list.color }]} />
            <Text style={styles.listTitle} numberOfLines={1}>
              {list.title}
            </Text>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditList(list)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil" size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteList(list)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {list.description && (
            <Text style={styles.listDescription} numberOfLines={2}>
              {list.description}
            </Text>
          )}

          <View style={styles.listFooter}>
            <Text style={styles.listStats}>
              {list.totalItems === 0
                ? "No items"
                : `${list.doneItems}/${list.totalItems} items`}
            </Text>
            {list.totalItems > 0 && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(list.doneItems / list.totalItems) * 100}%`,
                      backgroundColor: list.color,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BCB77" />
        <Text style={styles.loadingText}>Loading lists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
        <Text style={styles.headerSubtitle}>
          {lists.length === 0 ? "No lists yet" : `${lists.length} list${lists.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6BCB77"]}
            tintColor="#6BCB77"
          />
        }
      >
        {lists.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="list-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Lists Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first list to get started organizing your items
            </Text>
          </View>
        ) : (
          <View style={styles.listsContainer}>
            {lists.map(renderListCard)}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateList}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  listsContainer: {
    padding: 16,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  colorBar: {
    height: 6,
    width: "100%",
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  listTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginRight: 12,
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  listDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listStats: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    minWidth: 80,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6BCB77",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
