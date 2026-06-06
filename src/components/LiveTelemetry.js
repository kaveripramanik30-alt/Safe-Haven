// src/components/LiveTelemetry.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect, Line, G } from 'react-native-svg';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function LiveTelemetry({ history }) {
  if (!history || history.length === 0) return null;

  const width = 320;
  const height = 120;
  const padding = 10;
  
  const points = history.length;
  const step = (width - padding * 2) / (points - 1);

  // Map values to Y coordinates
  // Max acc we plot is 40 m/s^2 (approx 4G)
  // Max gyro we plot is 10 rad/s
  const getAccY = (val) => {
    const clamped = Math.min(40, Math.max(0, val));
    return height - padding - (clamped / 40) * (height - padding * 2);
  };

  const getGyroY = (val) => {
    const clamped = Math.min(10, Math.max(0, val));
    return height - padding - (clamped / 10) * (height - padding * 2);
  };

  // Build SVG Path strings
  let accPath = '';
  let gyroPath = '';

  history.forEach((pt, idx) => {
    const x = padding + idx * step;
    const yAcc = getAccY(pt.acc);
    const yGyro = getGyroY(pt.gyro);

    if (idx === 0) {
      accPath = `M ${x} ${yAcc}`;
      gyroPath = `M ${x} ${yGyro}`;
    } else {
      accPath += ` L ${x} ${yAcc}`;
      gyroPath += ` L ${x} ${yGyro}`;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sensor Telemetry (Real-time)</Text>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: COLORS.info }]} />
          <Text style={styles.legendText}>Accel (m/s²)</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendText}>Gyro (rad/s)</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Background Grid */}
          <Rect x={padding} y={padding} width={width - padding * 2} height={height - padding * 2} fill="#111827" rx={4} />
          
          {/* Warning Threshold Line (25 m/s^2 for Accel) */}
          <Line 
            x1={padding} 
            y1={getAccY(25)} 
            x2={width - padding} 
            y2={getAccY(25)} 
            stroke={COLORS.danger} 
            strokeDasharray="4 4" 
            strokeWidth="1" 
            opacity="0.5"
          />

          {/* Grid lines */}
          <Line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#374151" strokeWidth="0.5" />

          {/* Accelerometer Path */}
          <Path
            d={accPath}
            fill="none"
            stroke={COLORS.info}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gyroscope Path */}
          <Path
            d={gyroPath}
            fill="none"
            stroke={COLORS.warning}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={styles.footer}>
        <Text style={styles.telemetryText}>
          Acc: <Text style={{ color: COLORS.info, fontWeight: 'bold' }}>{history[history.length - 1]?.acc.toFixed(1)} m/s²</Text>
        </Text>
        <Text style={styles.telemetryText}>
          Gyro: <Text style={{ color: COLORS.warning, fontWeight: 'bold' }}>{history[history.length - 1]?.gyro.toFixed(1)} rad/s</Text>
        </Text>
        <Text style={styles.telemetryText}>
          Panic: <Text style={{ color: COLORS.danger, fontWeight: 'bold' }}>{history[history.length - 1]?.panic}%</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    marginLeft: 10,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingTop: SPACING.xs,
  },
  telemetryText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
