import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function SavingOverlay({ visible, message = "Saving...", submessage = "Please don't navigate away" }) {
  if (!visible) return null;

  return (
    <View style={styles.savingOverlay}>
      <View style={styles.savingBox}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.savingOverlayText}>{message}</Text>
        <Text style={styles.savingOverlaySubtext}>{submessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  savingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  savingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  savingOverlayText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  savingOverlaySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
});
