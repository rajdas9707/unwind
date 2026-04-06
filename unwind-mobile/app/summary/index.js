import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import { getSummaryScoresInRange } from "../../storage/summaryscore/db";
import { fetchJournalsByDate } from "../../storage/journal/storage";
import { fetchMistakesByDate } from "../../storage/mistakes/storage";
import { fetchOverthinkingByDate } from "../../storage/overthinking/storage";
import { router } from "expo-router";

function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function daysInMonth(d) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

function DatePicker({ value, onChange }) {
  const [visible, setVisible] = React.useState(false);
  const initialDate = React.useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00Z');
    }
    return new Date();
  }, [value]);
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(initialDate));
  const [selected, setSelected] = React.useState(initialDate);

  const goPrev = () => {
    const d = new Date(currentMonth);
    d.setUTCMonth(d.getUTCMonth() - 1);
    setCurrentMonth(startOfMonth(d));
  };
  const goNext = () => {
    const d = new Date(currentMonth);
    d.setUTCMonth(d.getUTCMonth() + 1);
    setCurrentMonth(startOfMonth(d));
  };

  const renderGrid = () => {
    const firstDay = currentMonth.getUTCDay(); // 0=Sun
    const total = daysInMonth(currentMonth);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);

    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();

    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={goPrev}><Text style={{ color: '#1F2937' }}>{'<'} Prev</Text></TouchableOpacity>
          <Text style={{ color: '#1F2937', fontWeight: '700' }}>
            {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={goNext}><Text style={{ color: '#1F2937' }}>Next {'>'}</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((w) => (
            <Text key={w} style={{ width: 32, textAlign: 'center', color: '#6B7280' }}>{w}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {days.map((d, idx) => {
            if (d === null) return <View key={`sp-${idx}`} style={{ width: 32, height: 32, margin: 2 }} />;
            const thisDate = new Date(Date.UTC(year, month, d));
            const isSel = formatDate(thisDate) === formatDate(selected);
            return (
              <TouchableOpacity
                key={`d-${idx}`}
                onPress={() => setSelected(thisDate)}
                style={{ width: 32, height: 32, margin: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel ? '#3B82F6' : '#F3F4F6' }}
              >
                <Text style={{ color: isSel ? '#FFFFFF' : '#111827', fontWeight: '600' }}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
          <Text style={{ color: '#6B7280', fontSize: 12 }}>{value || 'YYYY-MM-DD'}</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center', padding:16 }}>
          <View style={{ backgroundColor:'#FFFFFF', borderRadius:12, padding:12, width:'100%', maxWidth:360 }}>
            {renderGrid()}
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={{ color:'#6B7280', fontWeight:'700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { onChange(formatDate(selected)); setVisible(false); }}>
                <Text style={{ color:'#3B82F6', fontWeight:'700' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function DailySummaryScreen() {
  const [scores, setScores] = useState([]); // [{date, score}]
  const [cards, setCards] = useState([]);
  const [days, setDays] = useState(14);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    loadData();
  }, [days]);

  const toISO = (d) => d.toISOString().slice(0, 10);
  const parseDate = (s) => {
    const m = /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!m) return null;
    const d = new Date(s + 'T00:00:00Z');
    return isNaN(d.getTime()) ? null : d;
  };
  const eachDay = (startDate, endDate) => {
    const dates = [];
    const s = new Date(startDate);
    const e = new Date(endDate);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      dates.push(toISO(d));
    }
    return dates;
  };

  const loadData = async (rangeOverride) => {
    try {
      let startDate, endDate;
      if (rangeOverride?.start && rangeOverride?.end) {
        startDate = rangeOverride.start;
        endDate = rangeOverride.end;
      } else {
        const today = new Date();
        endDate = toISO(today);
        const start = new Date(today);
        start.setDate(today.getDate() - (days - 1));
        startDate = toISO(start);
      }

      const rows = await getSummaryScoresInRange({ startDate, endDate });
      // Map rows to dictionary for quick lookup
      const scoreMap = new Map(rows.map(r => [r.date, r.score]));
      const allDates = eachDay(startDate, endDate);
      const filledScores = allDates.map(date => ({ date, score: scoreMap.get(date) ?? 0 }));
      setScores(filledScores);

      // Cards only for dates that actually have a stored summary score
      const cardPromises = rows.map(async ({ date, score }) => {
        const [j, m, o] = await Promise.all([
          fetchJournalsByDate(date).catch(() => []),
          fetchMistakesByDate(date).catch(() => []),
          fetchOverthinkingByDate(date).catch(() => []),
        ]);
        return {
          date,
          score,
          counts: { journal: j.length, mistakes: m.length, overthinking: o.length },
        };
      });
      const cardData = await Promise.all(cardPromises);
      setCards(cardData.reverse()); // latest first
    } catch (e) {
      setScores([]);
      setCards([]);
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
        <Text style={styles.title}>Daily Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <LinearGradient colors={["#3B82F6", "#60A5FA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <Ionicons name="analytics" size={32} color="#FFFFFF" />
            <Text style={styles.headerCardTitle}>Summary Insights</Text>
            <Text style={styles.headerCardSubtitle}>Recent scores and activity overview</Text>
          </View>
        </LinearGradient>

        {/* Graph + Range Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Scores</Text>
            <View style={styles.rangeButtons}>
              {[7, 14, 30].map((d) => (
                <TouchableOpacity key={d} style={[styles.rangeButton, days === d && styles.rangeButtonActive]} onPress={() => { setDays(d); setCustomStart(""); setCustomEnd(""); }}>
                  <Text style={[styles.rangeButtonText, days === d && styles.rangeButtonTextActive]}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom range inputs */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>Start</Text><DatePicker value={customStart} onChange={(v) => setCustomStart(v)} /></View>
            <View style={styles.inputContainer}><Text style={styles.inputLabel}>End</Text><DatePicker value={customEnd} onChange={(v) => setCustomEnd(v)} /></View>
            <TouchableOpacity style={styles.applyButton} onPress={() => {
              const s = parseDate(customStart);
              const e = parseDate(customEnd);
              if (s && e && s <= e) {
                setDays(0);
                loadData({ start: toISO(s), end: toISO(e) });
              }
            }}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingVertical: 8 }}>
            {scores.length === 0 ? (
              <Text style={{ color: '#6B7280' }}>No summary scores yet</Text>
            ) : (
              (() => {
                const maxScore = Math.max(10, ...scores.map(x => x.score || 0));
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120 }}>
                    {/* Y-axis labels */}
                    <View style={{ width: 30, height: 100, justifyContent: 'space-between', marginRight: 6 }}>
                      <Text style={{ fontSize: 10, color: '#6B7280' }}>{maxScore}</Text>
                      <Text style={{ fontSize: 10, color: '#6B7280' }}>0</Text>
                    </View>
                    {/* Bars (horizontally scrollable) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, paddingRight: 8 }}>
                        {scores.map((s, idx) => {
                          const h = Math.max(6, Math.round((s.score / maxScore) * 100));
                          return (
                            <View key={`${s.date}-${idx}`} style={{ alignItems: 'center', marginHorizontal: 4 }}>
                              <View style={{ width: 12, height: h, backgroundColor: '#3B82F6', borderRadius: 3 }} />
                              <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{s.date.slice(5)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                );
              })()
            )}
          </View>
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days</Text>
          {cards.map((c) => (
            <TouchableOpacity key={c.date} style={styles.cardItem} onPress={() => router.push(`/summary/${c.date}`)}>
              <Ionicons name="calendar" size={18} color="#6B7280" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{c.date} • Score: {c.score}</Text>
                <Text style={styles.cardSubtitle}>
                  Journals: {c.counts.journal} • Mistakes: {c.counts.mistakes} • Overthinking: {c.counts.overthinking}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  placeholder: { width: 32 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  headerCard: { borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  headerCardContent: { padding: 16, gap: 8 },
  headerCardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerCardSubtitle: { color: '#E5E7EB' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeButtons: { flexDirection: 'row', gap: 8 },
  inputContainer: { flexDirection: 'column', gap: 4, flex: 1 },
  inputLabel: { color: '#6B7280', fontSize: 12 },
  applyButton: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700' },
  rangeButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  rangeButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
  rangeButtonText: { color: '#374151', fontSize: 12 },
  rangeButtonTextActive: { color: '#1D4ED8', fontWeight: '700' },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { color: '#111827', fontWeight: '600' },
  cardSubtitle: { color: '#6B7280', fontSize: 13, marginTop: 2 },
});
