import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AddDietModal from "../components/AddDietModal";
import {
  getDietItemsByDate,
  insertDietItem,
  insertRepeatDietItem,
  updateDietItem,
  updateRepeatDietItem,
  updateDietItemStatus,
  deleteDietItem,
  deleteRepeatDietItem,
  autoLoadRepeatingItems,
  getTodayDietProgress,
} from "../storage/diet/db";

/**
 * DietScreen Component
 * Main screen for managing diet items
 */
export default function DietScreen() {
  const [dietItems, setDietItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Load diet items from database
  const loadDietItems = async () => {
    try {
      const today = getTodayDate();
      
      // Auto-load repeating items first
      await autoLoadRepeatingItems();
      
      // Get today's diet items
      const items = await getDietItemsByDate(today);
      setDietItems(items);

      // Get progress
      const progressData = await getTodayDietProgress();
      setProgress(progressData);
    } catch (error) {
      console.error("Error loading diet items:", error);
      Alert.alert("Error", "Failed to load diet items");
    }
  };

  // Load items when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDietItems();
    }, [])
  );

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDietItems();
    setRefreshing(false);
  };

  // Handle add new item
  const handleAddItem = () => {
    setEditItem(null);
    setModalVisible(true);
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setEditItem(item);
    setModalVisible(true);
  };

  // Handle save (add or update)
  const handleSave = async (dietItem) => {
    try {
      const today = getTodayDate();

      if (editItem) {
        // Update existing item
        await updateDietItem({
          id: editItem.id,
          name: dietItem.name,
          time: dietItem.time,
        });

        // If repeat status changed
        if (dietItem.repeatDaily && !editItem.repeat_id) {
          // Add to repeat_diet_items
          const repeatItem = await insertRepeatDietItem({
            name: dietItem.name,
            time: dietItem.time,
          });
          
          // Update the diet_item with repeat_id
          await updateDietItem({
            id: editItem.id,
            name: dietItem.name,
            time: dietItem.time,
          });
        } else if (!dietItem.repeatDaily && editItem.repeat_id) {
          // Remove from repeat (just unlink, don't delete the repeat template)
          // User can choose to delete all repeats if they want
        }

        // If item has repeat_id and we're editing, update the repeat template too
        if (editItem.repeat_id && dietItem.repeatDaily) {
          await updateRepeatDietItem({
            id: editItem.repeat_id,
            name: dietItem.name,
            time: dietItem.time,
          });
        }
      } else {
        // Add new item
        if (dietItem.repeatDaily) {
          // First create repeat template
          const repeatItem = await insertRepeatDietItem({
            name: dietItem.name,
            time: dietItem.time,
          });

          // Then create today's instance
          await insertDietItem({
            name: dietItem.name,
            time: dietItem.time,
            date: today,
            repeatId: repeatItem.id,
          });
        } else {
          // Just add for today
          await insertDietItem({
            name: dietItem.name,
            time: dietItem.time,
            date: today,
            repeatId: null,
          });
        }
      }

      await loadDietItems();
    } catch (error) {
      console.error("Error saving diet item:", error);
      Alert.alert("Error", "Failed to save diet item");
    }
  };

  // Handle delete item
  const handleDeleteItem = (item) => {
    if (item.repeat_id) {
      // This is a repeating item - show options
      Alert.alert(
        "Delete Diet Item",
        "This is a repeating meal. What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Today Only",
            onPress: async () => {
              try {
                await deleteDietItem(item.id);
                await loadDietItems();
              } catch (error) {
                Alert.alert("Error", "Failed to delete item");
              }
            },
          },
          {
            text: "Delete All Repeats",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteRepeatDietItem(item.repeat_id);
                await loadDietItems();
              } catch (error) {
                Alert.alert("Error", "Failed to delete repeating item");
              }
            },
          },
        ]
      );
    } else {
      // Regular item - simple delete
      Alert.alert(
        "Delete Diet Item",
        `Are you sure you want to delete "${item.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteDietItem(item.id);
                await loadDietItems();
              } catch (error) {
                Alert.alert("Error", "Failed to delete item");
              }
            },
          },
        ]
      );
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (item) => {
    try {
      const newStatus = item.status === "completed" ? "pending" : "completed";
      await updateDietItemStatus(item.id, newStatus);
      await loadDietItems();
    } catch (error) {
      console.error("Error toggling status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Render diet item
  const renderDietItem = ({ item }) => {
    const isCompleted = item.status === "completed";

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemContent}>
          {/* Time Badge */}
          <View style={[styles.timeBadge, isCompleted && styles.timeBadgeCompleted]}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isCompleted ? "#fff" : "#007AFF"}
            />
            <Text style={[styles.timeText, isCompleted && styles.timeTextCompleted]}>
              {formatTime(item.time)}
            </Text>
          </View>

          {/* Item Details */}
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, isCompleted && styles.itemNameCompleted]}>
                {item.name}
              </Text>
            
            </View>
          </View>

          {/* Status Toggle */}
          <TouchableOpacity
            style={[styles.statusButton, isCompleted && styles.statusButtonCompleted]}
            onPress={() => handleStatusToggle(item)}
          >
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
              size={28}
              color={isCompleted ? "#10B981" : "#999"}
            />
          </TouchableOpacity>

           </View>
             
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
              {item.repeat_id && (
                <View style={styles.repeatBadge}>
                  <Ionicons name="repeat" size={12} color="#FF9500" />
                  <Text style={styles.repeatBadgeText}>Daily</Text>
                </View>
              )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditItem(item)}
            >
              <Ionicons name="create-outline" size={25} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteItem(item)}
            >
              <Ionicons name="trash-outline" size={25} color="#EF4444" />
            </TouchableOpacity>
         
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Meals Planned</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add your first meal
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Diet Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Card */}
      {dietItems.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>
              {progress.completed} / {progress.total} meals
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
          </View>
        </View>
      )}

      {/* Diet Items List */}
      <FlatList
        data={dietItems}
        renderItem={renderDietItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <AddDietModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        editItem={editItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerSpacer: {
    width: 40,
  },
  progressCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  progressCount: {
    fontSize: 14,
    color: "#666",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    minWidth: 40,
    textAlign: "right",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    gap: 12,
    
  },
  timeBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 72,
    justifyContent: "center",
  },
  timeBadgeCompleted: {
    backgroundColor: "#D1FAE5",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  timeTextCompleted: {
    color: "#10B981",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemNameCompleted: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  repeatBadge: {
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repeatBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF9500",
  },
  statusButton: {
    padding: 8,
    marginHorizontal: 8,
   
  },
  statusButtonCompleted: {
    // Additional styling if needed
  },
  actionButtons: {
     display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    gap: 10,
    marginLeft: 8,

  },
  actionButton: {
    padding: 8,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
