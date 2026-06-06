// src/components/MapViewer.js
import React from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import Svg, { Circle as SvgCircle, Path as SvgPath, Line as SvgLine, Rect as SvgRect, G as SvgG, Text as SvgText } from 'react-native-svg';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../styles/theme';

// Central geographic center (San Francisco coordinate references)
export const START_COORDS = { latitude: 37.7749, longitude: -122.4194 };
export const END_COORDS = { latitude: 37.7629, longitude: -122.4102 };

// Custom Premium Dark Map Style for react-native-maps (Native)
const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0b0c10" }] }
];

export default function MapViewer({ 
  selectedRoute, 
  setSelectedRoute, 
  timeOfDay, 
  userReports = [], 
  riskZones = [],
  routes = []
}) {
  const isWeb = Platform.OS === 'web';

  // 1. NATIVE MAP RENDERING
  if (!isWeb) {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (START_COORDS.latitude + END_COORDS.latitude) / 2,
            longitude: (START_COORDS.longitude + END_COORDS.longitude) / 2,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
          customMapStyle={mapDarkStyle}
          provider="google"
        >
          {/* Start and End Markers */}
          <Marker coordinate={START_COORDS} title="Your Location" pinColor="#10B981" />
          <Marker coordinate={END_COORDS} title="Destination" pinColor="#FF3366" />

          {/* Dynamic User Reports */}
          {userReports.map((report) => (
            <Marker
              key={report.id}
              coordinate={report.coords}
              title={report.title}
              description={report.description}
              pinColor="#F59E0B"
            />
          ))}

          {/* Unsafe Risk Areas Overlays */}
          {riskZones.map((zone) => {
            const riskConfig = zone.getRiskLevel(timeOfDay);
            return (
              <Circle
                key={zone.id}
                center={zone.coords}
                radius={zone.radius}
                strokeColor={riskConfig.color}
                fillColor={riskConfig.fillColor}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Route A (Shortest) */}
          {routes[0] && (
            <Polyline
              coordinates={routes[0].coordinates}
              strokeColor={selectedRoute === 'A' ? COLORS.danger : 'rgba(239, 68, 68, 0.4)'}
              strokeWidth={selectedRoute === 'A' ? 6 : 4}
              onPress={() => setSelectedRoute('A')}
              tappable={true}
            />
          )}

          {/* Route B (Safest) */}
          {routes[1] && (
            <Polyline
              coordinates={routes[1].coordinates}
              strokeColor={selectedRoute === 'B' ? COLORS.info : 'rgba(59, 130, 246, 0.4)'}
              strokeWidth={selectedRoute === 'B' ? 6 : 4}
              onPress={() => setSelectedRoute('B')}
              tappable={true}
            />
          )}
        </MapView>
      </View>
    );
  }

  // 2. WEB INTERACTIVE SVG MAP FALLBACK
  // SVG Canvas dimensions: 400x250
  // Mapping coordinates logically to fits 2D plane
  const startX = 60;
  const startY = 190;
  const endX = 340;
  const endY = 60;

  // Render Risk Zones in SVG
  const renderSvgRiskZones = () => {
    return riskZones.map((zone) => {
      // Map coords dynamically to SVG coordinate mapping system
      // Zone 1: Golden Gate Park (West/Left)
      // Zone 2: Mission Alley (Central/Right)
      // Zone 3: Tenderloin (North/Top)
      let sx = 200;
      let sy = 120;
      let r = 35;
      
      if (zone.id === '1') { sx = 120; sy = 150; r = 30; }
      else if (zone.id === '2') { sx = 280; sy = 100; r = 38; }
      else if (zone.id === '3') { sx = 180; sy = 50; r = 25; }

      const riskConfig = zone.getRiskLevel(timeOfDay);
      
      return (
        <SvgG key={zone.id}>
          {/* Outer glow ring */}
          <SvgCircle
            cx={sx}
            cy={sy}
            r={r}
            fill={riskConfig.fillColor}
            stroke={riskConfig.color}
            strokeWidth="1.5"
            opacity="0.7"
          />
          {/* Zone Title Indicator */}
          <SvgText
            x={sx}
            y={sy + 3}
            fill={COLORS.textPrimary}
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            opacity="0.9"
          >
            {zone.name.split(" ")[0]}
          </SvgText>
        </SvgG>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.webHint}>Interactive Web Canvas Simulator Active</Text>
      <View style={styles.svgWrapper}>
        <Svg width="100%" height={230} viewBox="0 0 400 250">
          {/* Base Grid Background */}
          <SvgRect width="400" height="250" fill="#0f172a" rx={16} />
          
          {/* Stylized Grid Roads */}
          <SvgLine x1="40" y1="20" x2="40" y2="230" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
          <SvgLine x1="140" y1="20" x2="140" y2="230" stroke="#1e293b" strokeWidth="6" />
          <SvgLine x1="240" y1="20" x2="240" y2="230" stroke="#1e293b" strokeWidth="8" /> {/* Main St */}
          <SvgLine x1="340" y1="20" x2="340" y2="230" stroke="#1e293b" strokeWidth="6" />
          
          <SvgLine x1="20" y1="60" x2="380" y2="60" stroke="#1e293b" strokeWidth="8" /> {/* Market St */}
          <SvgLine x1="20" y1="130" x2="380" y2="130" stroke="#1e293b" strokeWidth="5" />
          <SvgLine x1="20" y1="190" x2="380" y2="190" stroke="#1e293b" strokeWidth="6" />

          {/* Draw Risk Zones */}
          {renderSvgRiskZones()}

          {/* User Reports Pin Overlay (Simulated on Web) */}
          {userReports.map((report, idx) => {
            const ry = 130;
            const rx = 140 + idx * 80;
            return (
              <SvgG key={report.id}>
                <SvgCircle cx={rx} cy={ry} r="5" fill={COLORS.warning} />
                <SvgCircle cx={rx} cy={ry} r="10" fill={COLORS.warningGlow} opacity="0.5" />
              </SvgG>
            );
          })}

          {/* Route A: Shortest (Goes through Zone 2 Alleyway) */}
          {/* Red/Orange line */}
          <SvgPath
            d={`M ${startX} ${startY} L 140 ${startY} L 140 130 L 280 130 L 280 ${endY} L ${endX} ${endY}`}
            fill="none"
            stroke={selectedRoute === 'A' ? COLORS.danger : 'rgba(239, 68, 68, 0.35)'}
            strokeWidth={selectedRoute === 'A' ? '6' : '3'}
            strokeDasharray={selectedRoute === 'A' ? 'none' : '4 4'}
            onPress={() => setSelectedRoute('A')}
            style={{ cursor: 'pointer' }}
          />

          {/* Route B: Safest (Goes around along Main St) */}
          {/* Blue/Green line */}
          <SvgPath
            d={`M ${startX} ${startY} L 240 ${startY} L 240 ${endY} L ${endX} ${endY}`}
            fill="none"
            stroke={selectedRoute === 'B' ? COLORS.info : 'rgba(59, 130, 246, 0.35)'}
            strokeWidth={selectedRoute === 'B' ? '7' : '3.5'}
            onPress={() => setSelectedRoute('B')}
            style={{ cursor: 'pointer' }}
          />

          {/* START PIN (Safe Green Pulsing) */}
          <SvgG>
            <SvgCircle cx={startX} cy={startY} r="8" fill="rgba(16, 185, 129, 0.4)" />
            <SvgCircle cx={startX} cy={startY} r="4" fill={COLORS.safe} />
            <SvgText x={startX} y={startY + 20} fill={COLORS.textSecondary} fontSize="8" fontWeight="bold" textAnchor="middle">
              YOU
            </SvgText>
          </SvgG>

          {/* DESTINATION PIN (Crimson Red) */}
          <SvgG>
            <SvgCircle cx={endX} cy={endY} r="8" fill="rgba(255, 51, 102, 0.3)" />
            <SvgCircle cx={endX} cy={endY} r="4" fill={COLORS.danger} />
            <SvgText x={endX} y={endY - 12} fill={COLORS.textSecondary} fontSize="8" fontWeight="bold" textAnchor="middle">
              DEST
            </SvgText>
          </SvgG>
        </Svg>
      </View>
      <View style={styles.webMapLegend}>
        <TouchableOpacity 
          style={[styles.routeSelector, selectedRoute === 'A' && styles.routeSelectorActiveA]} 
          onPress={() => setSelectedRoute('A')}
        >
          <Text style={[styles.routeSelectorText, selectedRoute === 'A' && styles.textActive]}>Route A (Shortest)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.routeSelector, selectedRoute === 'B' && styles.routeSelectorActiveB]} 
          onPress={() => setSelectedRoute('B')}
        >
          <Text style={[styles.routeSelectorText, selectedRoute === 'B' && styles.textActive]}>Route B (Safest)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  map: {
    flex: 1,
  },
  webHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  svgWrapper: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapLegend: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  routeSelector: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  routeSelectorActiveA: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
  },
  routeSelectorActiveB: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  routeSelectorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textActive: {
    color: COLORS.textPrimary,
  },
});
