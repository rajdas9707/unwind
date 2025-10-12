import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ChartWebView from '../components/ChartWebView';
import { generateSampleChartData, calculateChartStats } from '../utils/chartUtils';

export default function ChartTestScreen() {
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = () => {
    const sampleData = generateSampleChartData(14);
    setChartData(sampleData);
    setStats(calculateChartStats(sampleData));
  };

  const loadEmptyData = () => {
    setChartData([]);
    setStats({});
  };

  const loadSinglePoint = () => {
    const singleData = [{ date: new Date().toISOString().split('T')[0], score: 8.5 }];
    setChartData(singleData);
    setStats(calculateChartStats(singleData));
  };

  const loadHighVariability = () => {
    const variableData = Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (9 - i));
      return {
        date: date.toISOString().split('T')[0],
        score: Math.random() * 10
      };
    });
    setChartData(variableData);
    setStats(calculateChartStats(variableData));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Chart Test Screen</Text>
          <Text style={styles.subtitle}>Testing the WebView Chart Component</Text>
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Chart</Text>
          <ChartWebView 
            data={chartData} 
            height={220}
            onError={(error) => console.log('Chart error:', error)}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.average?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.highest || '0'}</Text>
              <Text style={styles.statLabel}>Highest</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.lowest || '0'}</Text>
              <Text style={styles.statLabel}>Lowest</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { fontSize: 14 }]}>
                {stats.trend === 'improving' ? '📈' : stats.trend === 'declining' ? '📉' : '➡️'}
              </Text>
              <Text style={styles.statLabel}>Trend</Text>
            </View>
          </View>
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Different Scenarios</Text>
          
          <TouchableOpacity style={styles.button} onPress={loadTestData}>
            <Ionicons name="analytics" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Load Sample Data (14 days)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={loadEmptyData}>
            <Ionicons name="close-circle" size={20} color="#6366F1" />
            <Text style={[styles.buttonText, { color: '#6366F1' }]}>Empty Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={loadSinglePoint}>
            <Ionicons name="radio-button-on" size={20} color="#6366F1" />
            <Text style={[styles.buttonText, { color: '#6366F1' }]}>Single Data Point</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={loadHighVariability}>
            <Ionicons name="trending-up" size={20} color="#6366F1" />
            <Text style={[styles.buttonText, { color: '#6366F1' }]}>High Variability Data</Text>
          </TouchableOpacity>
        </View>

        {/* Data Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Data</Text>
          <View style={styles.dataInfo}>
            <Text style={styles.dataInfoText}>
              <Text style={styles.bold}>Points: </Text>{chartData.length}
            </Text>
            <Text style={styles.dataInfoText}>
              <Text style={styles.bold}>Date Range: </Text>
              {chartData.length > 0 
                ? `${chartData[0]?.date} to ${chartData[chartData.length - 1]?.date}`
                : 'No data'
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dataInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#374151',
  },
});