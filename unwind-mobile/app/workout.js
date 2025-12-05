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
import AddWorkoutModal from "../components/AddWorkoutModal";
import {
  getWorkoutItemsByDate,
  insertWorkoutItem,
  insertRepeatWorkoutItem,
  updateWorkoutItem,
  updateRepeatWorkoutItem,
  updateWorkoutItemStatus,
  deleteWorkoutItem,
  deleteRepeatWorkoutItem,
  autoLoadRepeatingWorkouts,
  getTodayWorkoutProgress,
} from "../storage/workout/db";

export default function WorkoutScreen() {
  const [workoutItems, setWorkoutItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const loadWorkoutItems = async () => {
    try {
      const today = getTodayDate();
      await autoLoadRepeatingWorkouts();
      const items = await getWorkoutItemsByDate(today);
      setWorkoutItems(items);
      const progressData = await getTodayWorkoutProgress();
      setProgress(progressData);
    } catch (error) {
      console.error("Error loading workout items:", error);
      Alert.alert("Error", "Failed to load workout items");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkoutItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkoutItems();
    setRefreshing(false);
  };

  const handleAddItem = () => {
    setEditItem(null);
    setModalVisible(true);
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setModalVisible(true);
  };

  const handleSave = async (workoutItem) => {
    try {
      const today = getTodayDate();

      if (editItem) {
        await updateWorkoutItem({
          id: editItem.id,
          name: workoutItem.name,
          sets: workoutItem.sets,
          reps: workoutItem.reps,
          time: workoutItem.time,
        });

        if (editItem.repeat_id && workoutItem.repeatDaily) {
          await updateRepeatWorkoutItem({
            id: editItem.repeat_id,
            name: workoutItem.name,
            sets: workoutItem.sets,
            reps: workoutItem.reps,
            time: workoutItem.time,
          });
        }
      } else {
        if (workoutItem.repeatDaily) {
          const repeatItem = await insertRepeatWorkoutItem({
            name: workoutItem.name,
            sets: workoutItem.sets,
            reps: workoutItem.reps,
            time: workoutItem.time,
          });

          await insertWorkoutItem({
            name: workoutItem.name,
            sets: workoutItem.sets,
            reps: workoutItem.reps,
            time: workoutItem.time,
            date: today,
            repeatId: repeatItem.id,
          });
        } else {
          await insertWorkoutItem({
            name: workoutItem.name,
            sets: workoutItem.sets,
            reps: workoutItem.reps,
            time: workoutItem.time,
            date: today,
            repeatId: null,
          });
        }
      }

      await loadWorkoutItems();
    } catch (error) {
      console.error("Error saving workout item:", error);
      Alert.alert("Error", "Failed to save workout item");
    }
  };

  const handleDeleteItem = (item) => {
    if (item.repeat_id) {
      Alert.alert(
        "Delete Workout",
        "This is a repeating workout. What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Today Only",
            onPress: async () => {
              try {
                await deleteWorkoutItem(item.id);
                await loadWorkoutItems();
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
                await deleteRepeatWorkoutItem(item.repeat_id);
                await loadWorkoutItems();
              } catch (error) {
                Alert.alert("Error", "Failed to delete repeating item");
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Delete Workout",
        `Are you sure you want to delete "${item.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteWorkoutItem(item.id);
                await loadWorkoutItems();
              } catch (error) {
                Alert.alert("Error", "Failed to delete item");
              }
            },
          },
        ]
      );
    }
  };

  const handleStatusToggle = async (item) => {
    try {
      const newStatus = item.status === "completed" ? "pending" : "completed";
      await updateWorkoutItemStatus(item.id, newStatus);
      await loadWorkoutItems();
    } catch (error) {
      console.error("Error toggling status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderWorkoutItem = ({ item }) => {
    const isCompleted = item.status === "completed";

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemContent}>

          <View style={[styles.timeBadge, isCompleted && styles.timeBadgeCompleted]}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isCompleted ? "#fff" : "#FF6B6B"}
            />
            <Text style={[styles.timeText, isCompleted && styles.timeTextCompleted]}>
              {formatTime(item.time)}
            </Text>
          </View>
          

          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, isCompleted && styles.itemNameCompleted]}>
                {item.name}
              </Text>
     
            </View>
            <Text style={[styles.setsReps, isCompleted && styles.setsRepsCompleted]}>
              {item.sets} × {item.reps} reps
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.statusButton, isCompleted && styles.statusButtonCompleted]}
            onPress={() => handleStatusToggle(item)}
          >
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
              size={28}
              color={isCompleted ? "#FF6B6B" : "#999"}
            />
          </TouchableOpacity>
              </View>
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Workouts Planned</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add your first workout
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {workoutItems.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>
              {progress.completed} / {progress.total} workouts
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

      <FlatList
        data={workoutItems}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddWorkoutModal
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
    backgroundColor: "#FF6B6B",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
    minWidth: 40,
    textAlign: "right",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBadge: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeBadgeCompleted: {
    backgroundColor: "#FFCDD2",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  timeTextCompleted: {
    color: "#D32F2F",
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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
  setsReps: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  setsRepsCompleted: {
    color: "#999",
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
    padding: 4,
  },
  statusButtonCompleted: {},
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    padding:6
  },
  actionButton: {
    padding: 8,
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
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
