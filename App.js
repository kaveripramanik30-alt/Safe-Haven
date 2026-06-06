import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';

// Core State Providers & Overlay Components
import { DangerProvider } from './src/components/DangerDetector';
import SafetyOverlay from './src/components/SafetyOverlay';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import AlertsScreen from './src/screens/AlertsScreen';

// Design Tokens
import { COLORS, BORDER_RADIUS, SPACING } from './src/styles/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Request foreground location permission on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Needed',
          'SafeHaven requires location access to send precise coordinates to your guardians in case of emergency.'
        );
        return;
      }
      setHasLocationPermission(true);
    })();
  }, []);

  // Screen Router
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'navigation':
        return <NavigationScreen />;
      case 'alerts':
        return <AlertsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <DangerProvider>
      <SafeAreaView style={styles.appContainer}>
        <StatusBar style="light" backgroundColor={COLORS.background} />

        {/* Global Security Overlay Context */}
        <SafetyOverlay />

        {/* Premium Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brandText}>
            🛡️ Safe<Text style={{ color: COLORS.danger }}>Haven</Text>
          </Text>
          <View style={styles.headerBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>SHIELD LIVE</Text>
          </View>
        </View>

        {/* Selected Screen Body */}
        <View style={styles.screenWrapper}>
          {renderScreen()}
        </View>

        {/* Floating Glassmorphic Bottom Navigation Bar */}
        <View style={styles.navBarContainer}>
          <View style={styles.navBar}>
            
            {/* Dashboard Tab */}
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
              onPress={() => setActiveTab('dashboard')}
              activeOpacity={0.7}
            >
              <Feather 
                name="shield" 
                size={20} 
                color={activeTab === 'dashboard' ? COLORS.danger : COLORS.textSecondary} 
              />
              <Text style={[styles.navText, activeTab === 'dashboard' && { color: COLORS.textPrimary, fontWeight: '800' }]}>
                Shield
              </Text>
            </TouchableOpacity>

            {/* Navigation Tab */}
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'navigation' && styles.navItemActive]}
              onPress={() => setActiveTab('navigation')}
              activeOpacity={0.7}
            >
              <Feather 
                name="map" 
                size={20} 
                color={activeTab === 'navigation' ? COLORS.info : COLORS.textSecondary} 
              />
              <Text style={[styles.navText, activeTab === 'navigation' && { color: COLORS.textPrimary, fontWeight: '800' }]}>
                Navigate
              </Text>
            </TouchableOpacity>

            {/* Alerts/Broadcast Tab */}
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'alerts' && styles.navItemActive]}
              onPress={() => setActiveTab('alerts')}
              activeOpacity={0.7}
            >
              <Feather 
                name="bell" 
                size={20} 
                color={activeTab === 'alerts' ? COLORS.warning : COLORS.textSecondary} 
              />
              <Text style={[styles.navText, activeTab === 'alerts' && { color: COLORS.textPrimary, fontWeight: '800' }]}>
                Alerts
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    </DangerProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  brandText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.safe,
    marginRight: 6,
  },
  activeText: {
    color: COLORS.safe,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  screenWrapper: {
    flex: 1,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '30%',
    gap: 4,
  },
  navItemActive: {
    backgroundColor: COLORS.background + '60',
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
});










