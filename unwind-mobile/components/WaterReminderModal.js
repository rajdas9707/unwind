import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

/**
 * WaterReminderModal Component
 * Extracted from app/(tabs)/index.js to keep the same UI and behavior
 * while living as a separate reusable component.
 *
 * All logic/state still lives in the parent screen; this component is
 * purely presentational and controlled via props.
 */
export default function WaterReminderModal({
  showModal,
  closeModal,
  editingReminder,
  startTime,
  endTime,
  intervalValue,
  intervalUnit,
  quantity,
  showStartPicker,
  showEndPicker,
  setShowStartPicker,
  setShowEndPicker,
  setStartTime,
  setEndTime,
  setIntervalValue,
  setIntervalUnit,
  setQuantity,
  formatTimeForDisplay,
  formatInterval,
  calculateCheckpoints,
  handleTimeChange,
  handleSaveReminder,
  loading,
  styles,
}) {
  return (
    <>
      {/* Water Reminder Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              style={styles.modalContent}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingReminder
                    ? "Edit Water Reminder"
                    : "Create Water Reminder"}
                </Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <ScrollView
                style={styles.modalForm}
                showsVerticalScrollIndicator={false}
              >
                {/* Time Pickers */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Schedule</Text>

                  <View style={styles.timePickerRow}>
                    <View style={styles.timePickerContainer}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#6B7280"
                        />
                        <Text style={styles.timePickerText}>
                          {formatTimeForDisplay(startTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.timePickerContainer}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#6B7280"
                        />
                        <Text style={styles.timePickerText}>
                          {formatTimeForDisplay(endTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Interval Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Reminder Interval</Text>

                  <View style={styles.intervalRow}>
                    <View style={styles.intervalValueContainer}>
                      <Text style={styles.inputLabel}>Every</Text>
                      <TextInput
                        style={styles.intervalInput}
                        value={intervalValue.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setIntervalValue(Math.max(1, Math.min(24, num)));
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>

                    <View style={styles.intervalUnitContainer}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <View style={styles.radioGroup}>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setIntervalUnit("minutes")}
                          accessibilityRole="button"
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              intervalUnit === "minutes" && styles.radioSelected,
                            ]}
                          >
                            {intervalUnit === "minutes" && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <Text style={styles.radioLabel}>Minutes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setIntervalUnit("hours")}
                          accessibilityRole="button"
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              intervalUnit === "hours" && styles.radioSelected,
                            ]}
                          >
                            {intervalUnit === "hours" && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <Text style={styles.radioLabel}>Hours</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Water Quantity */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Water Quantity</Text>
                  <View style={styles.quantityContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 50;
                        setQuantity(Math.max(50, Math.min(1000, num)));
                      }}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <Text style={styles.quantityLabel}>ml per reminder</Text>
                  </View>
                </View>

                {/* Preview */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Preview</Text>
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewText}>
                      You'll be reminded to drink {quantity}ml of water{" "}
                      {formatInterval(intervalValue, intervalUnit).toLowerCase()}{" "}
                      from {formatTimeForDisplay(startTime)} to{" "}
                      {formatTimeForDisplay(endTime)}.
                    </Text>
                    <Text style={styles.previewCheckpoints}>
                      Total checkpoints:{" "}
                      {
                        calculateCheckpoints(
                          startTime,
                          endTime,
                          intervalValue,
                          intervalUnit
                        ).length
                      }
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    loading && styles.modalSaveButtonDisabled,
                  ]}
                  onPress={handleSaveReminder}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={
                      loading ? ["#D1D5DB", "#D1D5DB"] : ["#3B82F6", "#1D4ED8"]
                    }
                    style={styles.modalSaveGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSaveText}>
                        {editingReminder ? "Update Reminder" : "Create Reminder"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Time Picker Overlay (same logic, fresh implementation) */}
      {showModal && (showStartPicker || showEndPicker) && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (showStartPicker) setShowStartPicker(false);
            if (showEndPicker) setShowEndPicker(false);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                width: "100%",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                paddingBottom: 24,
                paddingTop: 8,
                alignItems: "center",
              }}
            >
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = (showStartPicker
                    ? startTime
                    : endTime
                  )
                    .split(":")
                    .map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes, 0, 0);
                  return date;
                })()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedTime) =>
                  handleTimeChange(event, selectedTime, showStartPicker)
                }
                style={{ backgroundColor: "white" }}
              />

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: "#3B82F6",
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                  }}
                  onPress={() => {
                    if (showStartPicker) setShowStartPicker(false);
                    if (showEndPicker) setShowEndPicker(false);
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
