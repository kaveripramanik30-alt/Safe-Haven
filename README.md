# SafeHaven

**SafeHaven** is an intelligent personal safety system designed to provide real-time danger detection, dynamic threat mapping, and automated emergency responses. Built for modern mobile devices, the app utilizes device sensor telemetry and simulated ML classification models to protect users in critical moments where they might be unable to manually press an SOS button.

---

## Key Features

1. **Automatic Danger Detection (ML Classifiers)**
   * Continually samples accelerometer and gyroscope telemetry at 20Hz.
   * Runs an on-device rule-based Decision Tree classifier approximating ML forest models.
   * Accurately distinguishes normal movement from **Sudden Falls**, **Physical Struggles**, **Abnormal Shaking**, and **Panic Running**.
   * Triggers a 15-second critical warning countdown. If unanswered, it dispatches a distress SMS containing live coordinates and automatically dials your primary emergency guardian.

2. **AI Safe Route Recommendation**
   * Predicts a dynamic **Safety Score (0–100)** for navigation paths.
   * Compares the *Shortest Route* against the *Safest Route* options based on environmental factors (street lighting, crime logs, crowd density, time of day).
   * Recommends detours (e.g. Route B) at night when the shortest path becomes high-risk.

3. **Dynamic Unsafe Area Prediction**
   * Renders unsafe hotspots (crime hotspots, poorly-lit paths, crowd threats) directly on maps.
   * Features a custom **Time of Day** hour selector timeline, causing risk zones to dynamically expand, contract, and change threat levels (Green , Yellow , Red) based on temporal safety factors.

4. **Community Safety Alerts Broadcast**
   * Allows users to log localized hazards (e.g. broken streetlights, aggressive crowds, threats).
   * Live complaints pin directly onto maps and dynamically penalize nearby routing safety scores in real-time.

5. **ML Threat Simulation Deck & Live Telemetry**
   * A built-in simulation deck to inject simulated raw time-series sensor data streams for testing fall, struggle, or panic gestures.
   * Real-time line-graph charting plotting accelerometer variance, gyroscope velocity, and panic confidence scores.

---

## Technology Stack

* **Core Framework**: [React Native](https://reactnative.dev/) (Expo SDK 53)
* **Sensor Telemetry API**: `expo-sensors` (Accelerometer & Gyroscope interfaces)
* **Location Systems**: `expo-location` (GPS telemetry & reverse geocoding)
* **Data Persistence**: `@react-native-async-storage/async-storage` (contacts & local settings cache)
* **Map Visualizer**: `react-native-maps` (native dark-theme Google/Apple Maps) with an interactive **SVG-based vector map fallback** to support previewing/testing in Web environments.
* **Vector Graphics & Live Charts**: `react-native-svg` (rendering high-performance real-time telemetry line charts)
* **Emergency Triggers**: Native SMS composer mapping (`expo-sms`) and dialer launchers (`Linking`)
* **Design System**: Customized obsidian-slate design system with glassmorphism overlays and glowing status meters.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Servers
Run the project in Expo Go on physical devices, emulators, or in a web browser:

```bash
# Start standard Expo server
npx expo start

# Run directly on platforms
npm run android    # Android Emulator/Device
npm run ios        # iOS Simulator/Device
npm run web        # Web Browser Preview
```
