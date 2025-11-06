import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

/**
 * AddDietModal Component
 * Modal for adding or editing diet items
 * 
 * @param {boolean} visible - Modal visibility state
 * @param {function} onClose - Function to close modal
 * @param {function} onSave - Function to save diet item
 * @param {object} editItem - Item to edit (null for new item)
 */
export default function AddDietModal({ visible, onClose, onSave, editItem }) {
  const [mealName, setMealName] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Initialize form when editItem changes
  useEffect(() => {
    if (editItem) {
      setMealName(editItem.name || "");
      setRepeatDaily(editItem.repeat_id !== null);
      
      // Parse time string (HH:MM) to Date object
      if (editItem.time) {
        const [hours, minutes] = editItem.time.split(":");
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours, 10));
        timeDate.setMinutes(parseInt(minutes, 10));
        setSelectedTime(timeDate);
      }
    } else {
      // Reset for new item
      setMealName("");
      setRepeatDaily(false);
      setSelectedTime(new Date());
    }
  }, [editItem, visible]);

  // Handle time change from picker
  const handleTimeChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    
    if (date) {
      setSelectedTime(date);
    }
  };

  // Format time for display (HH:MM AM/PM)
  const formatTimeDisplay = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Format time for storage (HH:MM 24-hour format)
  const formatTimeForStorage = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const displayHours = hours < 10 ? `0${hours}` : hours;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes}`;
  };

  // Handle save button press
  const handleSave = () => {
    if (!mealName.trim()) {
      Alert.alert("Required Field", "Please enter a meal name");
      return;
    }

    const dietItem = {
      name: mealName.trim(),
      time: formatTimeForStorage(selectedTime),
      repeatDaily: repeatDaily,
    };

    if (editItem) {
      dietItem.id = editItem.id;
      dietItem.repeatId = editItem.repeat_id;
    }

    onSave(dietItem);
    handleClose();
  };

  // Handle modal close
  const handleClose = () => {
    setMealName("");
    setRepeatDaily(false);
    setSelectedTime(new Date());
    setShowTimePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editItem ? "Edit Diet Item" : "Add Diet Item"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Meal Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meal Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Breakfast, Protein Shake, Salad"
                value={mealName}
                onChangeText={setMealName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Time Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.timeButtonText}>
                  {formatTimeDisplay(selectedTime)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Time Picker Component */}
            {showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Repeat Daily Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="repeat" size={20} color="#007AFF" />
                  <Text style={styles.label}>Repeat Daily</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    repeatDaily && styles.toggleActive,
                  ]}
                  onPress={() => setRepeatDaily(!repeatDaily)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      repeatDaily && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                {repeatDaily
                  ? "This meal will appear every day at this time"
                  : "This meal is for today only"}
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                {repeatDaily
                  ? "Repeating meals will automatically appear each day. You can delete individual days or all future repeats."
                  : "This meal will only appear for today. You can always add it again later."}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {editItem ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  timeButton: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  pickerContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#007AFF",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  helpText: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    marginLeft: 8,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
