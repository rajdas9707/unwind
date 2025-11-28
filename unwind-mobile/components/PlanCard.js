// ...existing code...
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PlanCard({ plan, onPress }) {
  // safe values
  const id = plan && plan.id;
  const label = (plan && plan.label) || 'Plan';
  const durationRaw = (plan && plan.duration) || '';
  const priceValue = plan && typeof plan.price === 'number' ? plan.price : null;
  const currency = (plan && plan.currency) || '';
  const tier = (plan && plan.tier) || 'standard';

  const duration = useMemo(() => {
    if (!durationRaw) return '';
    return durationRaw.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, [durationRaw]);

  const formattedPrice = useMemo(() => {
    if (priceValue == null) return '';
    try {
      // prefer en-IN for INR but fall back to generic formatting
      const locale = currency === 'INR' ? 'en-IN' : undefined;
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(priceValue);
    } catch {
      return `${currency} ${priceValue}`;
    }
  }, [priceValue, currency]);

  const tierColor = tier === 'premium' ? '#D4AF37' : tier === 'basic' ? '#9CA3AF' : '#06B6D4';

  return (
    <TouchableOpacity
      testID={id}
      activeOpacity={0.9}
      onPress={() => onPress && onPress(plan)}
      style={styles.card}
    >
      <View style={[styles.leftPill, { backgroundColor: tierColor }]}>
        <Text style={styles.pillText}>{tier.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.duration}>{duration}</Text>
        <Text style={styles.price}>{formattedPrice}</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.tier}>{tier.toUpperCase()}</Text>
        <TouchableOpacity
          onPress={() => onPress && onPress(plan)}
          style={[styles.button, { backgroundColor: tier === 'premium' ? '#1F2937' : '#06B6D4' }]}
        >
          <Text style={styles.buttonText}>Choose</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  leftPill: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pillText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b1220',
  },
  duration: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13,
  },
  price: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
    color: '#0b1220',
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  tier: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
