import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, onClose, type = 'info', title, message, buttonText = 'Got it' }) => {
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle',
          iconColor: '#10B981',
          gradientColors: ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)'],
          borderColor: 'rgba(16, 185, 129, 0.3)',
        };
      case 'error':
        return {
          iconName: 'close-circle',
          iconColor: '#EF4444',
          gradientColors: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)'],
          borderColor: 'rgba(239, 68, 68, 0.3)',
        };
      case 'warning':
        return {
          iconName: 'warning',
          iconColor: '#F59E0B',
          gradientColors: ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.05)'],
          borderColor: 'rgba(245, 158, 11, 0.3)',
        };
      default:
        return {
          iconName: 'information-circle',
          iconColor: '#8B5CF6',
          gradientColors: ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)'],
          borderColor: 'rgba(139, 92, 246, 0.3)',
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { borderColor: alertStyle.borderColor }]}>
          <View style={[styles.iconContainer, { backgroundColor: alertStyle.gradientColors[0] }]}>
            <Ionicons name={alertStyle.iconName} size={32} color={alertStyle.iconColor} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: alertStyle.iconColor }]} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  alertContainer: {
    width: width - 64,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '400',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: 'rgba(139, 92, 246, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CustomAlert;