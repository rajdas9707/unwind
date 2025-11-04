import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  fetchItemsForList,
  createListItem,
  updateListItemData,
  deleteListItem,
  toggleListItemStatus,
} from "../../storage/customLists/storage";

export default function ListDetailsScreen() {
  const params = useLocalSearchParams();
  const listId = parseInt(params.id);
  const listName = params.listName || "List";
  const listColor = params.listColor || "#6BCB77";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Undo Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [deletedItem, setDeletedItem] = useState(null);
  const snackbarAnim = useRef(new Animated.Value(0)).current;
  const undoTimeoutRef = useRef(null);

  // Load items from storage
  const loadItems = async () => {
    try {
      const allItems = await fetchItemsForList(listId);
      setItems(allItems);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh items
  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  // Focus effect to reload data
  useFocusEffect(
    useCallback(() => {
      if (listId) {
        loadItems();
      }
    }, [listId])
  );

  // Show snackbar
  const showSnackbar = (item) => {
    setDeletedItem(item);
    setSnackbarVisible(true);
    Animated.timing(snackbarAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 5 seconds
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      hideSnackbar();
    }, 5000);
  };

  // Hide snackbar
  const hideSnackbar = () => {
    Animated.timing(snackbarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSnackbarVisible(false);
      setDeletedItem(null);
    });
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  };

  // Undo delete
  const handleUndo = async () => {
    if (!deletedItem) return;
    
    hideSnackbar();
    
    try {
      await createListItem({
        listId,
        title: deletedItem.title,
        note: deletedItem.note,
      });
      await loadItems();
    } catch (error) {
      console.error("Error undoing delete:", error);
      Alert.alert("Error", "Failed to restore item");
    }
  };

  // Create new item
  const handleCreateItem = async () => {
    if (creating || !itemTitle.trim()) return;

    setCreating(true);
    try {
      await createListItem({
        listId,
        title: itemTitle.trim(),
        note: itemNote.trim(),
      });
      setModalVisible(false);
      setItemTitle("");
      setItemNote("");
      await loadItems();
    } catch (error) {
      console.error("Error creating item:", error);
      Alert.alert("Error", error.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  // Toggle item status
  const handleToggleStatus = async (itemId) => {
    try {
      await toggleListItemStatus(itemId);
      await loadItems();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  // Edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemNote(item.note || "");
    setEditModalVisible(true);
  };

  // Update item
  const handleUpdateItem = async () => {
    if (updating || !itemTitle.trim() || !editingItem) return;

    setUpdating(true);
    try {
      await updateListItemData({
        id: editingItem.id,
        title: itemTitle.trim(),
        note: itemNote.trim(),
        status: editingItem.status,
      });
      setEditModalVisible(false);
      setEditingItem(null);
      setItemTitle("");
      setItemNote("");
      await loadItems();
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", error.message || "Failed to update item");
    } finally {
      setUpdating(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item) => {
    try {
      await deleteListItem(item.id);
      await loadItems();
      showSnackbar(item);
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item");
    }
  };

  // Cancel modals
  const handleCancelModal = () => {
    setModalVisible(false);
    setItemTitle("");
    setItemNote("");
  };

  const handleCancelEditModal = () => {
    setEditModalVisible(false);
    setEditingItem(null);
    setItemTitle("");
    setItemNote("");
  };

  // Render item card
  const renderItem = (item) => {
    const isDone = item.status === "done";

    return (
      <View key={item.id} style={[styles.itemCard, isDone && styles.itemCardDone]}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleToggleStatus(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
              {isDone && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </View>

          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.note && (
              <Text style={[styles.itemNote, isDone && styles.itemNoteDone]} numberOfLines={2}>
                {item.note}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditItem(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteItem(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={listColor} />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  const pendingItems = items.filter((item) => item.status === "pending");
  const doneItems = items.filter((item) => item.status === "done");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {listName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {items.length === 0
              ? "Empty list"
              : `${doneItems.length}/${items.length} completed`}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Color bar */}
      <View style={[styles.colorBar, { backgroundColor: listColor }]} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[listColor]}
            tintColor={listColor}
          />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkbox-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Items Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first item to start organizing
            </Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {/* Pending items */}
            {pendingItems.map(renderItem)}

            {/* Done items section */}
            {doneItems.length > 0 && (
              <View style={styles.completedSection}>
                <Text style={styles.completedSectionTitle}>
                  Completed ({doneItems.length})
                </Text>
                {doneItems.map(renderItem)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: listColor }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={handleCancelModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter item title"
                value={itemTitle}
                onChangeText={setItemTitle}
                maxLength={200}
                autoFocus={true}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add a note"
                value={itemNote}
                onChangeText={setItemNote}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: listColor },
                  (creating || !itemTitle.trim()) && styles.saveButtonDisabled,
                ]}
                onPress={handleCreateItem}
                disabled={creating || !itemTitle.trim()}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleCancelEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={handleCancelEditModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter item title"
                value={itemTitle}
                onChangeText={setItemTitle}
                maxLength={200}
                autoFocus={true}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add a note"
                value={itemNote}
                onChangeText={setItemNote}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEditModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: listColor },
                  (updating || !itemTitle.trim()) && styles.saveButtonDisabled,
                ]}
                onPress={handleUpdateItem}
                disabled={updating || !itemTitle.trim()}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo Snackbar */}
      {snackbarVisible && (
        <Animated.View
          style={[
            styles.snackbar,
            {
              transform: [
                {
                  translateY: snackbarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: snackbarAnim,
            },
          ]}
        >
          <View style={styles.snackbarContent}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.snackbarText}>Item deleted</Text>
          </View>
          <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
            <Text style={styles.undoButtonText}>UNDO</Text>
          </TouchableOpacity>
        </Animated.View>
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
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  headerSpacer: {
    width: 32,
  },
  colorBar: {
    height: 4,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemCardDone: {
    opacity: 0.6,
    backgroundColor: "#F9FAFB",
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 20,
  },
  itemTitleDone: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  itemNote: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 18,
  },
  itemNoteDone: {
    color: "#9CA3AF",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  completedSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  completedSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
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
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  snackbar: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  snackbarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  snackbarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  undoButtonText: {
    color: "#6BCB77",
    fontSize: 16,
    fontWeight: "700",
  },
});
