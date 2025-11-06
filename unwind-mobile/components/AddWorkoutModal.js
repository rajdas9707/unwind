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
 * AddWorkoutModal Component
 * Modal for adding or editing workout items
 * 
 * @param {boolean} visible - Modal visibility state
 * @param {function} onClose - Function to close modal
 * @param {function} onSave - Function to save workout item
 * @param {object} editItem - Item to edit (null for new item)
 */
export default function AddWorkoutModal({ visible, onClose, onSave, editItem }) {
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Initialize form when editItem changes
  useEffect(() => {
    if (editItem) {
      setExerciseName(editItem.name || "");
      setSets(editItem.sets ? editItem.sets.toString() : "3");
      setReps(editItem.reps ? editItem.reps.toString() : "12");
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
      setExerciseName("");
      setSets("3");
      setReps("12");
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
    // Validation
    if (!exerciseName.trim()) {
      Alert.alert("Required Field", "Please enter an exercise name");
      return;
    }

    const setsNum = parseInt(sets);
    const repsNum = parseInt(reps);

    if (isNaN(setsNum) || setsNum < 1) {
      Alert.alert("Invalid Input", "Sets must be a number greater than 0");
      return;
    }

    if (isNaN(repsNum) || repsNum < 1) {
      Alert.alert("Invalid Input", "Reps must be a number greater than 0");
      return;
    }

    const workoutItem = {
      name: exerciseName.trim(),
      sets: setsNum,
      reps: repsNum,
      time: formatTimeForStorage(selectedTime),
      repeatDaily: repeatDaily,
    };

    if (editItem) {
      workoutItem.id = editItem.id;
      workoutItem.repeatId = editItem.repeat_id;
    }

    onSave(workoutItem);
    handleClose();
  };

  // Handle modal close
  const handleClose = () => {
    setExerciseName("");
    setSets("3");
    setReps("12");
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
              {editItem ? "Edit Workout" : "Add Workout"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Exercise Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exercise Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Push-ups, Squats, Plank"
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Sets and Reps Row */}
            <View style={styles.rowInputGroup}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Sets *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.label}>Reps *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Time Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time of Day *</Text>
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
                  ? "This workout will appear every day at this time"
                  : "This workout is for today only"}
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#FF6B6B" />
              <Text style={styles.infoText}>
                {repeatDaily
                  ? "Repeating workouts will automatically appear each day. You can delete individual days or all future repeats."
                  : "This workout will only appear for today. You can always add it again later."}
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
  rowInputGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
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
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#D32F2F",
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
