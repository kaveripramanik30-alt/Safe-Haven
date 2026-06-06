// src/components/SafetyOverlay.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Vibration, Linking, ActivityIndicator } from 'react-native';
import { useDanger } from './DangerDetector';
import { getContacts, getSettings } from '../utils/storage';
import * as Location from 'expo-location';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../styles/theme';

export default function SafetyOverlay() {
  const { panicScore, detectedState, resetDetection } = useDanger();
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [contacts, setContacts] = useState([]);
  const [sensitivity, setSensitivity] = useState(75);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  
  const timerRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const isTriggered = useRef(false);

  // Load configuration and contacts
  const loadConfig = async () => {
    try {
      const storedContacts = await getContacts();
      const settings = await getSettings();
      setContacts(storedContacts);
      setSensitivity(settings.sensitivity);
      setCountdown(settings.countdownTime);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConfig();
    // Refresh config periodically when overlay is not open
    if (!showOverlay) {
      const interval = setInterval(loadConfig, 3000);
      return () => clearInterval(interval);
    }
  }, [showOverlay]);

  // Monitor panic score
  useEffect(() => {
    if (panicScore >= sensitivity && !showOverlay && !isTriggered.current) {
      triggerThreatState();
    }
  }, [panicScore, sensitivity]);

  const triggerThreatState = async () => {
    isTriggered.current = true;
    setShowOverlay(true);
    const settings = await getSettings();
    setCountdown(settings.countdownTime);

    // Start critical alert vibration pattern: Vibrate on-off
    Vibration.vibrate([0, 500, 300, 500, 300], true);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          dispatchSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleImSafe = () => {
    // Clear all timers and vibrations
    clearInterval(timerRef.current);
    Vibration.cancel();
    resetDetection();
    setShowOverlay(false);
    isTriggered.current = false;
    setIsSendingAlert(false);
  };

  const dispatchSOS = async () => {
    setIsSendingAlert(true);
    Vibration.cancel();
    
    // Vibrate deeply to signal alert has been sent
    Vibration.vibrate([500, 200, 500, 200, 1000]);

    try {
      // 1. Get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      let locString = "Location unavailable";
      let mapsUrl = "";

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        locString = `latitude: ${lat.toFixed(5)}, longitude: ${lng.toFixed(5)}`;
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }

      // 2. Format emergency messages
      const emergencyMessage = `🚨 EMERGENCY ALERT: SafeHaven detected a ${detectedState}. I may be in danger. My location: ${locString}. Map link: ${mapsUrl}`;

      // 3. Send SMS using Linking (open system dialer/SMS prefilled)
      if (contacts.length > 0) {
        // Send to first contact
        const primaryContact = contacts[0];
        
        // Open SMS composer
        const smsUrl = `sms:${primaryContact.phone}?body=${encodeURIComponent(emergencyMessage)}`;
        await Linking.openURL(smsUrl);

        // Wait a bit, then launch call to primary contact
        setTimeout(async () => {
          const telUrl = `tel:${primaryContact.phone}`;
          await Linking.openURL(telUrl);
        }, 1500);
      } else {
        // Fallback to standard emergency response line
        await Linking.openURL(`sms:911?body=${encodeURIComponent(emergencyMessage)}`);
      }
    } catch (err) {
      console.warn("Failed to dispatch SOS:", err);
    } finally {
      // Clean up overlay state after opening dialers
      handleImSafe();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={showOverlay}
      animationType="fade"
      onRequestClose={handleImSafe}
    >
      <View style={styles.overlayContainer}>
        {/* Semi-transparent dark blur representation */}
        <View style={styles.blurBackground} />

        <View style={styles.contentCard}>
          <Text style={styles.warningTag}>🚨 CRITICAL ALERT</Text>
          <Text style={styles.threatText}>
            Danger Detected: <Text style={styles.alertType}>{detectedState.toUpperCase()}</Text>
          </Text>
          
          <Text style={styles.prompt}>Are you safe?</Text>

          {/* Countdown Indicator */}
          <View style={styles.countdownRing}>
            {isSendingAlert ? (
              <ActivityIndicator size="large" color={COLORS.danger} />
            ) : (
              <Text style={styles.countdownNumber}>{countdown}</Text>
            )}
            <Text style={styles.countdownLabel}>seconds remaining</Text>
          </View>

          <Text style={styles.instruction}>
            SafeHaven will automatically notify your emergency contacts and dial local emergency lines if you do not respond.
          </Text>

          {/* Buttons */}
          <TouchableOpacity style={styles.safeButton} onPress={handleImSafe}>
            <Text style={styles.safeButtonText}>YES, I AM SAFE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.triggerNowButton} onPress={dispatchSOS} disabled={isSendingAlert}>
            <Text style={styles.triggerNowText}>TRIGGER SOS IMMEDIATELY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 16, 0.95)', // Deep dark overlay
  },
  contentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.danger,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.glowDanger,
  },
  warningTag: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  threatText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  alertType: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  prompt: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  countdownRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 51, 102, 0.05)',
  },
  countdownNumber: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: '900',
  },
  countdownLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  safeButton: {
    backgroundColor: COLORS.safe,
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.safe,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  safeButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  triggerNowButton: {
    paddingVertical: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  triggerNowText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
