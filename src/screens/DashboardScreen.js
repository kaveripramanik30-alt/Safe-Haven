// src/screens/DashboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { useDanger } from '../components/DangerDetector';
import LiveTelemetry from '../components/LiveTelemetry';
import ContactManager from '../components/ContactManager';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../styles/theme';

export default function DashboardScreen() {
  const { 
    isTracking, 
    panicScore, 
    detectedState, 
    telemetryHistory, 
    startTracking, 
    stopTracking, 
    simulateDanger, 
    resetDetection 
  } = useDanger();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the main SOS button
  useEffect(() => {
    let animation;
    if (panicScore > 30) {
      // Fast, frantic pulse when panic is mounting
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    } else {
      // Slow, calm pulse during normal state
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    }

    animation.start();
    return () => animation.stop();
  }, [panicScore]);

  // Turn on tracking automatically on load
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  const handleManualSOSPress = () => {
    // Set panic score directly to threshold to trigger SafetyOverlay
    Vibration.vibrate(100);
    // Artificially trigger threat overlay
    simulateDanger('struggle'); // struggle simulation starts immediately and triggers the threshold
  };

  const getStatusColor = () => {
    if (panicScore > 70) return COLORS.danger;
    if (panicScore > 40) return COLORS.warning;
    return COLORS.safe;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Dynamic Security HUD Banner */}
      <View style={[styles.hudBanner, { borderColor: getStatusColor() }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.hudText}>
          STATUS: <Text style={{ color: getStatusColor(), fontWeight: '900' }}>
            {panicScore > 70 ? 'DANGER DETECTED' : panicScore > 40 ? 'MONITORING ACTIVITY (ALERT)' : 'SHIELD SECURE'}
          </Text>
        </Text>
      </View>

      {/* Pulsing SOS Button Container */}
      <View style={styles.sosContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], borderColor: getStatusColor(), opacity: panicScore > 50 ? 0.6 : 0.2 }]} />
        <TouchableOpacity 
          style={[styles.sosButton, { backgroundColor: getStatusColor() === COLORS.safe ? COLORS.danger : getStatusColor() }]} 
          onPress={handleManualSOSPress}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>PRESS TO ACTIVATE</Text>
        </TouchableOpacity>
      </View>

      {/* Live Classifier Performance Indicator */}
      <View style={styles.classifierHUD}>
        <View style={styles.scoreRow}>
          <Text style={styles.indicatorLabel}>Active Heuristics:</Text>
          <Text style={[styles.indicatorVal, { color: panicScore > 40 ? COLORS.danger : COLORS.textPrimary }]}>{detectedState}</Text>
        </View>

        {/* Panic Score Meter */}
        <View style={styles.meterContainer}>
          <Text style={styles.meterLabel}>Panic Confidence Meter ({panicScore}%)</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${panicScore}%`, backgroundColor: getStatusColor() }]} />
          </View>
        </View>
      </View>

      {/* Telemetry Visualizer Chart */}
      <LiveTelemetry history={telemetryHistory} />

      {/* Danger Simulation Deck (Ideal for verification / emulators) */}
      <View style={styles.deckContainer}>
        <Text style={styles.deckTitle}>ML Threat Simulation Deck</Text>
        <Text style={styles.deckSub}>
          Use these simulation scenarios to inject real-time raw accelerometer and gyroscope time-series data vectors into the danger detection engine.
        </Text>
        
        <View style={styles.deckRow}>
          <TouchableOpacity 
            style={[styles.simButton, { borderColor: COLORS.danger }]}
            onPress={() => simulateDanger('fall')}
          >
            <Text style={styles.simEmoji}>🚨</Text>
            <Text style={styles.simBtnText}>Sudden Fall</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.simButton, { borderColor: COLORS.danger }]}
            onPress={() => simulateDanger('struggle')}
          >
            <Text style={styles.simEmoji}>💥</Text>
            <Text style={styles.simBtnText}>Struggle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deckRow}>
          <TouchableOpacity 
            style={[styles.simButton, { borderColor: COLORS.warning }]}
            onPress={() => simulateDanger('panic')}
          >
            <Text style={styles.simEmoji}>🏃‍♂️</Text>
            <Text style={styles.simBtnText}>Panic Run</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.simButton, { borderColor: COLORS.warning }]}
            onPress={() => simulateDanger('shaking')}
          >
            <Text style={styles.simEmoji}>📳</Text>
            <Text style={styles.simBtnText}>Shaking</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetSimBtn} onPress={resetDetection}>
          <Text style={styles.resetSimText}>Reset Model Calibrations</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contact Drawer */}
      <ContactManager />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  hudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.lg,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  hudText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  pulseCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glowDanger,
  },
  sosText: {
    color: COLORS.textPrimary,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sosSubtext: {
    color: 'rgba(248, 250, 252, 0.8)',
    fontSize: 9,
    fontWeight: '800',
    marginTop: SPACING.xs,
  },
  classifierHUD: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  indicatorLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  indicatorVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  meterContainer: {
    marginTop: SPACING.xs,
  },
  meterLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  deckContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  deckTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  deckSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  deckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  simButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  simEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  simBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  resetSimBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  resetSimText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
