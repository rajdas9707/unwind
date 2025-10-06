import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { fetchDailySummaryByDate } from "../../api/dailySummary";

export default function SummaryDetailScreen() {
  const { id } = useLocalSearchParams(); // id is the date string YYYY-MM-DD
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchDailySummaryByDate(String(id));
        if (!mounted) return;
        if (res.success) setData(res.data);
      } catch {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Summary Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={["#60A5FA", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <Ionicons name="analytics" size={32} color="#FFFFFF" />
            <Text style={styles.headerCardTitle}>Date: {id}</Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={{ padding: 16 }}>
            <ActivityIndicator />
          </View>
        ) : data ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score: {data.score}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Highlights</Text>
            {(data.highlights || []).map((h, i) => (
              <Text key={i} style={styles.listItem}>• {h}</Text>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Actionable Tips</Text>
            {(data.actionableTips || []).map((t, i) => (
              <Text key={i} style={styles.listItem}>• {t}</Text>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No summary found for this date.</Text>
          </View>
        )}
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
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  listItem: { color: '#374151', marginTop: 6 },
});
