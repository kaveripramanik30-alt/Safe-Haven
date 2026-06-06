// src/screens/NavigationScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import MapViewer, { START_COORDS, END_COORDS } from '../components/MapViewer';
import { getLocalReports } from '../utils/storage';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../styles/theme';

// Define standard Unsafe Risk Zones around route coords
const STATIC_RISK_ZONES = [
  {
    id: '1',
    name: 'Park Walkway',
    radius: 350,
    coords: { latitude: 37.7715, longitude: -122.4220 },
    getRiskLevel: (hour) => {
      if (hour >= 20 || hour < 5) {
        return { label: 'High Risk', color: COLORS.danger, fillColor: 'rgba(255, 51, 102, 0.35)' };
      }
      if (hour >= 17 || hour < 20) {
        return { label: 'Moderate Risk', color: COLORS.warning, fillColor: 'rgba(245, 158, 11, 0.25)' };
      }
      return { label: 'Safe', color: COLORS.safe, fillColor: 'rgba(16, 185, 129, 0.15)' };
    }
  },
  {
    id: '2',
    name: 'Mission Alley',
    radius: 400,
    coords: { latitude: 37.7650, longitude: -122.4150 },
    getRiskLevel: (hour) => {
      if (hour >= 18 || hour < 6) {
        return { label: 'High Risk', color: COLORS.danger, fillColor: 'rgba(255, 51, 102, 0.35)' };
      }
      return { label: 'Moderate Risk', color: COLORS.warning, fillColor: 'rgba(245, 158, 11, 0.25)' };
    }
  },
  {
    id: '3',
    name: 'Market Crossings',
    radius: 250,
    coords: { latitude: 37.7800, longitude: -122.4120 },
    getRiskLevel: (hour) => {
      if (hour >= 22 || hour < 4) {
        return { label: 'Moderate Risk', color: COLORS.warning, fillColor: 'rgba(245, 158, 11, 0.2)' };
      }
      return { label: 'Safe', color: COLORS.safe, fillColor: 'rgba(16, 185, 129, 0.1)' };
    }
  }
];

// Sample coordinates representing paths
const ROUTE_A_COORDS = [
  START_COORDS,
  { latitude: 37.7725, longitude: -122.4190 },
  { latitude: 37.7680, longitude: -122.4170 },
  { latitude: 37.7650, longitude: -122.4150 }, // cross Mission Alley
  { latitude: 37.7635, longitude: -122.4120 },
  END_COORDS
];

const ROUTE_B_COORDS = [
  START_COORDS,
  { latitude: 37.7740, longitude: -122.4150 }, // stay on main road
  { latitude: 37.7710, longitude: -122.4130 },
  { latitude: 37.7680, longitude: -122.4110 },
  END_COORDS
];

export default function NavigationScreen() {
  const [selectedRoute, setSelectedRoute] = useState('B'); // B is Safest by default
  const [timeOfDay, setTimeOfDay] = useState(new Date().getHours());
  const [userReports, setUserReports] = useState([]);

  // Load user filed alerts to update mapping safety scores dynamically
  const loadReports = async () => {
    const list = await getLocalReports();
    setUserReports(list);
  };

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 3000); // refresh reports
    return () => clearInterval(interval);
  }, []);

  // Compute safety scores dynamically based on time of day and user reports
  const getRouteMetrics = (routeId) => {
    const isNight = timeOfDay >= 19 || timeOfDay < 5;
    const isTransition = (timeOfDay >= 17 && timeOfDay < 19) || (timeOfDay >= 5 && timeOfDay < 7);
    
    // Check if any crowd-sourced complaints fall along the routes
    const routeAReportsCount = userReports.filter(r => r.category === 'lighting' || r.category === 'harassment').length;
    const routeBReportsCount = userReports.filter(r => r.category === 'crowd' || r.category === 'other').length;

    if (routeId === 'A') {
      // Route A (Shortest): Poor lighting + Crime incidents
      let score = 75;
      let time = 10; // 10 mins
      
      if (isNight) score = 35;
      else if (isTransition) score = 55;

      // Penalize for crowd reports
      score -= routeAReportsCount * 12;
      score = Math.max(10, score);

      return {
        score,
        time,
        features: [
          'Unlit alleys (Mission Alley path)',
          'High recent crime density reports',
          isNight ? '⚠️ High risk of darkness collisions' : 'Active road constructs'
        ],
        alertsCount: routeAReportsCount,
      };
    } else {
      // Route B (Safest): Good lighting + Active avenues
      let score = 92;
      let time = 13; // 13 mins

      if (isNight) score = 83; // Stays relatively safe due to lights
      else if (isTransition) score = 89;

      score -= routeBReportsCount * 8;
      score = Math.max(25, score);

      return {
        score,
        time,
        features: [
          'Well-lit arterial street lighting',
          'High police patrol coverage',
          'Active business frontages'
        ],
        alertsCount: routeBReportsCount,
      };
    }
  };

  const routeAMetrics = getRouteMetrics('A');
  const routeBMetrics = getRouteMetrics('B');

  // Recommend route based on highest safety rating
  const recommendedRoute = routeBMetrics.score >= routeAMetrics.score ? 'B' : 'A';

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${suffix}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.safe;
    if (score >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 24-Hour Timeline Hour Selector */}
      <View style={styles.timeSliderCard}>
        <View style={styles.sliderHeader}>
          <Text style={styles.cardTitle}>Simulate Time of Day</Text>
          <Text style={styles.timeDisplay}>{formatHour(timeOfDay)}</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeScroll}
        >
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
            const isSelected = timeOfDay === hour;
            const isNight = hour >= 19 || hour < 5;
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.hourCard,
                  isSelected && styles.hourCardSelected,
                ]}
                onPress={() => setTimeOfDay(hour)}
              >
                <Text style={[styles.hourText, isSelected && styles.hourTextActive]}>
                  {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </Text>
                <View style={[styles.hourIndicator, { backgroundColor: isNight ? COLORS.danger : COLORS.safe }]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.sliderHint}>Risk zones and safety scores adapt dynamically to nighttime hazard multipliers (Red = Night Risk, Green = Day Safe).</Text>
      </View>

      {/* Cross-platform Map */}
      <MapViewer
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        timeOfDay={timeOfDay}
        userReports={userReports}
        riskZones={STATIC_RISK_ZONES}
        routes={[
          { id: 'A', coordinates: ROUTE_A_COORDS },
          { id: 'B', coordinates: ROUTE_B_COORDS }
        ]}
      />

      {/* AI Recommendation Badge */}
      <View style={styles.recommendationBanner}>
        <Text style={styles.recommendationText}>
          🤖 AI RECOMMENDATION:{' '}
          <Text style={{ color: COLORS.safe, fontWeight: '900' }}>
            ROUTE {recommendedRoute} ({recommendedRoute === 'B' ? 'Safest' : 'Fastest & Safe'})
          </Text>
        </Text>
      </View>

      {/* Route Info Display Cards */}
      <View style={styles.routesStack}>
        
        {/* Route A Card */}
        <TouchableOpacity 
          style={[styles.routeCard, selectedRoute === 'A' && styles.routeCardActiveA]}
          onPress={() => setSelectedRoute('A')}
          activeOpacity={0.9}
        >
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeName}>Route A (Shortest Path)</Text>
              <Text style={styles.routeTime}>{routeAMetrics.time} mins • Direct</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(routeAMetrics.score) + '20', borderColor: getScoreColor(routeAMetrics.score) }]}>
              <Text style={[styles.scoreVal, { color: getScoreColor(routeAMetrics.score) }]}>{routeAMetrics.score}</Text>
              <Text style={styles.scoreLabel}>SAFETY</Text>
            </View>
          </View>
          
          <View style={styles.bulletList}>
            {routeAMetrics.features.map((f, i) => (
              <Text key={i} style={styles.bulletItem}>• {f}</Text>
            ))}
            {routeAMetrics.alertsCount > 0 && (
              <Text style={styles.hazardAlert}>⚠️ {routeAMetrics.alertsCount} community report(s) active on this path.</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Route B Card */}
        <TouchableOpacity 
          style={[styles.routeCard, selectedRoute === 'B' && styles.routeCardActiveB]}
          onPress={() => setSelectedRoute('B')}
          activeOpacity={0.9}
        >
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeName}>Route B (Safest Path)</Text>
              <Text style={styles.routeTime}>{routeBMetrics.time} mins • +3m detour</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(routeBMetrics.score) + '20', borderColor: getScoreColor(routeBMetrics.score) }]}>
              <Text style={[styles.scoreVal, { color: getScoreColor(routeBMetrics.score) }]}>{routeBMetrics.score}</Text>
              <Text style={styles.scoreLabel}>SAFETY</Text>
            </View>
          </View>

          <View style={styles.bulletList}>
            {routeBMetrics.features.map((f, i) => (
              <Text key={i} style={styles.bulletItem}>• {f}</Text>
            ))}
            {routeBMetrics.alertsCount > 0 && (
              <Text style={styles.hazardAlert}>⚠️ {routeBMetrics.alertsCount} community report(s) active on this path.</Text>
            )}
          </View>
        </TouchableOpacity>

      </View>
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
    paddingBottom: SPACING.xxl,
  },
  timeSliderCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timeDisplay: {
    color: COLORS.info,
    fontSize: 15,
    fontWeight: '800',
  },
  timeScroll: {
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  hourCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
  },
  hourCardSelected: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.info + '15',
  },
  hourText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  hourTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  hourIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: SPACING.xs,
  },
  sliderHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: SPACING.sm,
    lineHeight: 14,
  },
  recommendationBanner: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  recommendationText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routesStack: {
    gap: SPACING.md,
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  routeCardActiveA: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 51, 102, 0.02)',
  },
  routeCardActiveB: {
    borderColor: COLORS.info,
    borderWidth: 1.5,
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  routeName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  routeTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scoreBadge: {
    width: 50,
    height: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bulletList: {
    gap: SPACING.xs,
  },
  bulletItem: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  hazardAlert: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
});
