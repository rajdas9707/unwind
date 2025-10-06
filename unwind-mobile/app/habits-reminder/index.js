import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { getAllHabits, insertHabit, updateHabitNotifIds, deleteHabit, updateHabit, setHabitEnabled } from "../../storage/habits/db";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function HabitsReminderScreen() {
  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifyTime, setNotifyTime] = useState("08:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Ensure notification channel (Android)
        await Notifications.setNotificationChannelAsync("habit-channel", { name: "Habit Reminders", importance: Notifications.AndroidImportance.DEFAULT });

        const rows = await getAllHabits();
        // Cleanup expired habits: cancel notifications and remove
        const today = new Date().toISOString().slice(0,10);
        const active = [];
        for (const h of rows) {
          if (h.end_date < today) {
            if (h.notif_ids && Array.isArray(h.notif_ids)) {
              for (const id of h.notif_ids) {
                try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
              }
            }
            // remove from DB
            try { const db = (await import("../../storage/mainDb")).openDB; const realdb = await db(); await realdb.runAsync("DELETE FROM habits WHERE id = ?", [h.id]); } catch {}
          } else {
            // Ensure notifications exist if missing and habit is enabled
            if (h.enabled && (!h.notif_ids || h.notif_ids.length === 0)) {
              try {
                const ids = [];
                const [hh, mm] = (h.notify_time || '08:00').split(":").map(Number);
                const start = new Date(Math.max(new Date(h.start_date + 'T00:00:00').getTime(), new Date().setHours(0,0,0,0)));
                const end = new Date(h.end_date + 'T00:00:00');
                const dayMs = 24*60*60*1000;
                for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
                  const fire = new Date(d);
                  fire.setHours(hh, mm, 0, 0);
                  if (fire.getTime() > Date.now()) {
                    const id = await Notifications.scheduleNotificationAsync({ content: { title: 'Habit Reminder', body: h.name }, trigger: fire });
                    ids.push(id);
                  }
                }
                if (ids.length) await updateHabitNotifIds({ id: h.id, notifIds: ids });
                h.notif_ids = ids;
              } catch {}
            }
            active.push(h);
          }
        }
        setHabits(active);
      } catch (e) {}
    })();
  }, []);

  const markedDates = useMemo(() => {
    if (!startDate) return {};
    const marks = {};
    const start = new Date(startDate + 'T00:00:00Z');
    const end = endDate ? new Date(endDate + 'T00:00:00Z') : start;
    const dayMs = 24*60*60*1000;
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
      const ds = d.toISOString().slice(0,10);
      marks[ds] = {
        startingDay: ds === startDate,
        endingDay: ds === (endDate || startDate),
        color: '#10B981', textColor: 'white'
      };
    }
    return marks;
  }, [startDate, endDate]);

  const onDayPress = (day) => {
    const date = day.dateString; // YYYY-MM-DD
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate("");
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const openModal = () => {
    setEditingHabit(null);
    setHabitName("");
    setStartDate("");
    setEndDate("");
    setNotifyTime("08:00");
    setModalVisible(true);
  };

  const openModalForEdit = (habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setStartDate(habit.start_date);
    setEndDate(habit.end_date);
    setNotifyTime(habit.notify_time || "08:00");
    setModalVisible(true);
  };

  const saveHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert("Missing name", "Please enter a habit name.");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Missing dates", "Please select a start and end date.");
      return;
    }
    const todayISO = new Date().toISOString().slice(0,10);
    if (startDate < todayISO) {
      Alert.alert("Invalid start date", "Start date cannot be in the past.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(notifyTime)) {
      Alert.alert("Missing time", "Please select a daily notification time.");
      return;
    }
    try {
      // If editing, cancel existing notifications
      if (editingHabit && editingHabit.notif_ids && Array.isArray(editingHabit.notif_ids)) {
        for (const id of editingHabit.notif_ids) {
          try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
        }
      }

      // Schedule per-day notifications between start and end (inclusive)
      const notifIds = [];
      const [hh, mm] = notifyTime.split(":").map(Number);
      const dayMs = 24*60*60*1000;
      for (let d = new Date(startDate + 'T00:00:00'); d <= new Date(endDate + 'T00:00:00'); d = new Date(d.getTime() + dayMs)) {
        const fire = new Date(d);
        fire.setHours(hh, mm, 0, 0);
        if (fire.getTime() > Date.now()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: { title: "Habit Reminder", body: habitName.trim(), sound: undefined },
            trigger: fire,
          });
          notifIds.push(id);
        }
      }

      if (editingHabit) {
        await updateHabit({ id: editingHabit.id, name: habitName.trim(), startDate, endDate, notifyTime, notifIds });
      } else {
        await insertHabit({ name: habitName.trim(), startDate, endDate, notifyTime, notifIds });
      }
      const rows = await getAllHabits();
      setHabits(rows);
      setModalVisible(false);
      setEditingHabit(null);
    } catch (e) {
      Alert.alert("Error", "Failed to save habit.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Everyday Habits Reminder</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro Card */}
        <LinearGradient colors={["#34D399", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <Ionicons name="repeat" size={28} color="#FFFFFF" />
            <Text style={styles.headerCardTitle}>Build Daily Routines</Text>
            <Text style={styles.headerCardSubtitle}>Set gentle reminders for habits you want to practice every day</Text>
          </View>
        </LinearGradient>

        {/* Habits list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          {habits.length === 0 ? (
            <Text style={{ color: '#6B7280' }}>No habits yet. Tap + to add one.</Text>
          ) : (
            habits.map(h => (
              <LinearGradient key={h.id} colors={["#ECFEFF", "#F0FDF4"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.habitCardGradient}>
                <View style={styles.habitCardInner}>
                  <View style={styles.habitIcon}><Ionicons name="repeat" size={18} color="#10B981" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitName}>{h.name}</Text>
                    <Text style={styles.habitDates}>{h.start_date} to {h.end_date} • {h.notify_time}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {/* Toggle notifications switch */}
                    <TouchableOpacity
                      onPress={async () => {
                        if (h.enabled) {
                          if (h.notif_ids && Array.isArray(h.notif_ids)) {
                            for (const id of h.notif_ids) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch {} }
                          }
                          await setHabitEnabled({ id: h.id, enabled: false, notifIds: [] });
                        } else {
                          const ids = [];
                          const [hh, mm] = (h.notify_time || '08:00').split(":").map(Number);
                          const start = new Date(Math.max(new Date(h.start_date + 'T00:00:00').getTime(), new Date().setHours(0,0,0,0)));
                          const end = new Date(h.end_date + 'T00:00:00');
                          const dayMs = 24*60*60*1000;
                          for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
                            const fire = new Date(d);
                            fire.setHours(hh, mm, 0, 0);
                            if (fire.getTime() > Date.now()) {
                              const id = await Notifications.scheduleNotificationAsync({ content: { title: 'Habit Reminder', body: h.name }, trigger: fire });
                              ids.push(id);
                            }
                          }
                          await setHabitEnabled({ id: h.id, enabled: true, notifIds: ids });
                        }
                        const rows = await getAllHabits();
                        setHabits(rows);
                      }}
                      style={[styles.switch, h.enabled ? styles.switchOn : styles.switchOff]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.knob, h.enabled ? styles.knobRight : styles.knobLeft]} />
                      <Text style={[styles.switchLabel, h.enabled ? styles.switchLabelOn : styles.switchLabelOff]}>{h.enabled ? 'On' : 'Off'}</Text>
                    </TouchableOpacity>

                    {/* Action buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity onPress={() => openModalForEdit(h)} style={{ padding: 8, borderRadius: 10, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' }}>
                        <Ionicons name="pencil" size={16} color="#4F46E5" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={async () => {
                        // cancel notifications
                        if (h.notif_ids && Array.isArray(h.notif_ids)) {
                          for (const id of h.notif_ids) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch {} }
                        }
                        try { await deleteHabit(h.id); } catch {}
                        const rows = await getAllHabits();
                        setHabits(rows);
                      }} style={{ padding: 8, borderRadius: 10, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }}>
                        <Ionicons name="trash" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={openModal} activeOpacity={0.9}>
          <LinearGradient colors={["#10B981", "#059669"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Create Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Habit</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 16 }}>
                <Text style={styles.inputLabel}>Habit Name</Text>
                <TextInput value={habitName} onChangeText={setHabitName} placeholder="e.g., Morning Walk" style={styles.textInput} />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Date Range</Text>
                <Calendar
                  markingType={'period'}
                  markedDates={markedDates}
                  onDayPress={onDayPress}
                />
                <Text style={{ color: '#6B7280', marginTop: 6 }}>Selected: {startDate || '—'} {endDate ? `to ${endDate}` : ''}</Text>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Daily Notification Time</Text>
                <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time" size={16} color="#10B981" />
                  <Text style={{ marginLeft: 8, color: '#065F46', fontWeight: '600' }}>{notifyTime}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={saveHabit}>
                  <LinearGradient colors={["#10B981", "#059669"]} style={styles.modalSaveGradient}>
                    <Text style={styles.modalSaveText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Time picker portal */}
      {showTimePicker && (
        <DateTimePicker
          value={(() => { const d = new Date(); const [h,m] = notifyTime.split(":").map(Number); d.setHours(h||8, m||0, 0, 0); return d; })()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event, selected) => {
            if (event.type === 'set' && selected) {
              const hh = String(selected.getHours()).padStart(2,'0');
              const mm = String(selected.getMinutes()).padStart(2,'0');
              setNotifyTime(`${hh}:${mm}`);
            }
            setShowTimePicker(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  placeholder: { width: 32 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  headerCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  headerCardContent: { padding: 16, gap: 8 },
  headerCardTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerCardSubtitle: { color: "#ECFDF5", fontSize: 13 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  paragraph: { color: "#374151", lineHeight: 22 },
  habitCardGradient: { borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  habitCardInner: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  habitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  habitName: { fontWeight: '700', color: '#111827' },
  habitDates: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 420 },
  modalContent: { paddingVertical: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  inputLabel: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  modalActions: { flexDirection: 'row', gap: 12, padding: 16 },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  modalCancelText: { color: '#6B7280', fontWeight: '700' },
  modalSaveButton: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 12, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700' },
  timeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#ECFDF5', borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  switch: { width: 64, height: 28, borderRadius: 16, padding: 3, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  switchOn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  switchOff: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', position: 'absolute' },
  knobLeft: { left: 3 },
  knobRight: { right: 3 },
  switchLabel: { flex: 1, textAlign: 'center', fontWeight: '700' },
  switchLabelOn: { color: '#166534' },
  switchLabelOff: { color: '#374151' },

  // FAB Styles
  fab: { position: 'absolute', right: 20, bottom: 24 },
  fabButton: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
