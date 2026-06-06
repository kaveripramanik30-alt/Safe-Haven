// src/components/DangerDetector.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Platform } from 'react-native';

const DangerContext = createContext(null);

export const useDanger = () => {
  const context = useContext(DangerContext);
  if (!context) {
    throw new Error('useDanger must be used within a DangerProvider');
  }
  return context;
};

// Sampling rates: 20Hz (50ms interval)
const UPDATE_INTERVAL_MS = 50;
const BUFFER_SIZE = 50; // 2.5 seconds of data

export const DangerProvider = ({ children }) => {
  const [sensorState, setSensorState] = useState({
    acc: { x: 0, y: 1, z: 0, mag: 9.81 },
    gyro: { x: 0, y: 0, z: 0, mag: 0 },
    panicScore: 0,
    detectedState: 'Normal', // Normal, Shaking, Fall, Struggle, Running
    isTracking: false,
    isSimulating: false,
  });

  // Circular buffers for statistical analysis
  const accBuffer = useRef([]);
  const gyroBuffer = useRef([]);
  
  // Historical logs for the UI telemetry chart (keeps last 50 points of magnitudes)
  const [telemetryHistory, setTelemetryHistory] = useState(
    Array(50).fill({ acc: 9.81, gyro: 0, panic: 0 })
  );

  const trackingRef = useRef(false);
  const simulationTimer = useRef(null);

  // 1. Feature Extraction and ML Decision Heuristics
  const classifyMovement = (accData, gyroData) => {
    // 1. Add new items to buffers
    accBuffer.current.push(accData);
    gyroBuffer.current.push(gyroData);

    if (accBuffer.current.length > BUFFER_SIZE) accBuffer.current.shift();
    if (gyroBuffer.current.length > BUFFER_SIZE) gyroBuffer.current.shift();

    const n = accBuffer.current.length;
    if (n < 10) return { panicScore: 0, state: 'Calibrating...' };

    // 2. Compute statistical features
    let sumAcc = 0;
    let maxAcc = 0;
    let minAcc = 999;
    
    let sumGyro = 0;
    let maxGyro = 0;

    accBuffer.current.forEach(pt => {
      sumAcc += pt.mag;
      if (pt.mag > maxAcc) maxAcc = pt.mag;
      if (pt.mag < minAcc) minAcc = pt.mag;
    });

    gyroBuffer.current.forEach(pt => {
      sumGyro += pt.mag;
      if (pt.mag > maxGyro) maxGyro = pt.mag;
    });

    const meanAcc = sumAcc / n;
    const meanGyro = sumGyro / n;

    // Variance calculation
    let varAccSum = 0;
    let varGyroSum = 0;
    for (let i = 0; i < n; i++) {
      varAccSum += Math.pow(accBuffer.current[i].mag - meanAcc, 2);
      varGyroSum += Math.pow(gyroBuffer.current[i].mag - meanGyro, 2);
    }
    const varAcc = varAccSum / n;
    const varGyro = varGyroSum / n;

    // 3. Classifier Trees (Rules approximating Random Forest / Gradient Boosting outputs)
    let panicScore = 0;
    let detectedState = 'Normal';

    // PROFILE A: Sudden Fall
    // High-G spike (> 26 m/s^2), preceded by low-G freefall (< 3.0 m/s^2) and followed by relative stillness (varAcc < 1.0)
    let hasFreeFall = false;
    let hasImpact = false;
    let stillPostImpact = false;

    // Look back to analyze profiles in the buffer
    for (let i = 0; i < n; i++) {
      if (accBuffer.current[i].mag < 3.2) {
        hasFreeFall = true;
      }
      if (hasFreeFall && accBuffer.current[i].mag > 26.0) {
        hasImpact = true;
        // Check if user lies still in the remaining buffer
        if (i < n - 10) {
          let postImpactSum = 0;
          let samplesAfter = 0;
          for (let j = i + 1; j < n; j++) {
            postImpactSum += Math.pow(accBuffer.current[j].mag - 9.81, 2);
            samplesAfter++;
          }
          const postImpactVar = postImpactSum / (samplesAfter || 1);
          if (postImpactVar < 1.5) {
            stillPostImpact = true;
          }
        }
      }
    }

    if (hasFreeFall && hasImpact) {
      if (stillPostImpact) {
        panicScore = 95;
        detectedState = 'Sudden Fall (Immobile)';
      } else {
        panicScore = 80;
        detectedState = 'Sudden Fall (Recovered)';
      }
    } 
    // PROFILE B: Physical Struggle (High variance in both Accel and Gyro, multiple high spikes)
    else if (varAcc > 16.0 && maxGyro > 6.0) {
      // High-energy chaotic struggle
      panicScore = Math.min(98, Math.round(50 + (varAcc * 1.5) + (maxGyro * 3)));
      detectedState = 'Physical Struggle';
    } 
    // PROFILE C: Abnormal Shaking (High rate of vibration, moderate peaks)
    else if (varAcc > 8.0 && varGyro > 5.0) {
      panicScore = Math.min(85, Math.round(30 + (varAcc * 2) + (varGyro * 3)));
      detectedState = 'Abnormal Shaking';
    }
    // PROFILE D: Running / Panic Movement (High speed/agitation)
    else if (varAcc > 5.0 && maxGyro > 3.0) {
      panicScore = Math.min(75, Math.round(20 + (varAcc * 3) + (maxGyro * 2)));
      detectedState = 'Panic Movement';
    }
    // Normal activity
    else {
      // Gradual decay of panic score if things settle down
      panicScore = Math.max(0, Math.round(varAcc * 1.5 + meanGyro * 2));
      detectedState = 'Normal';
    }

    return { panicScore, state: detectedState };
  };

  // Update telemetry graph data
  const updateTelemetry = (accMag, gyroMag, panicScore) => {
    setTelemetryHistory(prev => {
      const updated = [...prev];
      updated.shift();
      updated.push({
        acc: Number(accMag.toFixed(2)),
        gyro: Number(gyroMag.toFixed(2)),
        panic: panicScore
      });
      return updated;
    });
  };

  // Handle incoming live sensor readings
  const handleSensorData = (accData, gyroData) => {
    const accMag = Math.sqrt(accData.x * accData.x + accData.y * accData.y + accData.z * accData.z) * 9.81;
    const gyroMag = Math.sqrt(gyroData.x * gyroData.x + gyroData.y * gyroData.y + gyroData.z * gyroData.z);

    const formattedAcc = { ...accData, mag: accMag };
    const formattedGyro = { ...gyroData, mag: gyroMag };

    const classification = classifyMovement(formattedAcc, formattedGyro);

    setSensorState(prev => ({
      ...prev,
      acc: formattedAcc,
      gyro: formattedGyro,
      panicScore: classification.panicScore,
      detectedState: classification.state,
    }));

    updateTelemetry(accMag, gyroMag, classification.panicScore);
  };

  // Toggle Live Tracking
  const startTracking = () => {
    if (trackingRef.current || sensorState.isSimulating) return;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);

    let lastAcc = { x: 0, y: 1, z: 0 };
    let lastGyro = { x: 0, y: 0, z: 0 };

    const accSub = Accelerometer.addListener(data => {
      lastAcc = data;
      handleSensorData(lastAcc, lastGyro);
    });

    const gyroSub = Gyroscope.addListener(data => {
      lastGyro = data;
      handleSensorData(lastAcc, lastGyro);
    });

    trackingRef.current = true;
    setSensorState(prev => ({ ...prev, isTracking: true }));

    return () => {
      accSub.remove();
      gyroSub.remove();
      trackingRef.current = false;
      setSensorState(prev => ({ ...prev, isTracking: false }));
    };
  };

  const stopTracking = () => {
    trackingRef.current = false;
    setSensorState(prev => ({ ...prev, isTracking: false }));
  };

  // Active / Deactivate trackers
  useEffect(() => {
    let cleanup;
    if (sensorState.isTracking && !sensorState.isSimulating) {
      cleanup = startTracking();
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [sensorState.isTracking, sensorState.isSimulating]);

  // 2. Telemetry Simulation Engine for Testing
  const simulateDanger = (type) => {
    if (sensorState.isSimulating) return;

    // Stop real tracking listeners during simulation
    stopTracking();
    
    setSensorState(prev => ({ ...prev, isSimulating: true, isTracking: false }));
    accBuffer.current = [];
    gyroBuffer.current = [];

    let elapsed = 0;
    const duration = 3000; // 3 seconds simulation
    const interval = UPDATE_INTERVAL_MS;

    simulationTimer.current = setInterval(() => {
      elapsed += interval;

      let simulatedAcc = { x: 0, y: 1, z: 0 };
      let simulatedGyro = { x: 0, y: 0, z: 0 };

      if (type === 'fall') {
        // FALL PROFILE: normal (0-400ms) -> freefall (400-700ms) -> impact (750ms) -> lying still (800ms+)
        if (elapsed < 400) {
          simulatedAcc = { x: 0.1, y: 0.9, z: 0.2 }; // Normal gravity ~9.81
          simulatedGyro = { x: 0.1, y: 0.1, z: 0.1 };
        } else if (elapsed < 700) {
          simulatedAcc = { x: 0.05, y: 0.1, z: 0.05 }; // Freefall magnitude ~ 1.2 m/s^2
          simulatedGyro = { x: 1.5, y: 2.0, z: 1.2 };  // Rotating during fall
        } else if (elapsed === 750 || elapsed === 800) {
          simulatedAcc = { x: 1.2, y: 2.5, z: 1.5 };   // Impact magnitude ~ 30.2 m/s^2
          simulatedGyro = { x: 4.5, y: 6.0, z: 5.5 };   // Chaotic rotation on impact
        } else {
          simulatedAcc = { x: 0.02, y: 0.05, z: 0.98 }; // User lying still on their back ~9.81 m/s^2
          simulatedGyro = { x: 0.01, y: 0.01, z: 0.01 }; // Zero rotation
        }
      } 
      else if (type === 'struggle') {
        // STRUGGLE PROFILE: Repeated violent spikes
        const wave = Math.sin(elapsed / 100);
        simulatedAcc = {
          x: (Math.random() * 1.5 + 0.5) * wave,
          y: (Math.random() * 1.5 + 0.5) * Math.cos(elapsed / 120),
          z: (Math.random() * 1.5 + 0.5) * wave,
        };
        simulatedGyro = {
          x: Math.random() * 6.5,
          y: Math.random() * 6.5,
          z: Math.random() * 6.5,
        };
      } 
      else if (type === 'shaking') {
        // SHAKING PROFILE: Rapid, continuous vibration, moderate magnitude
        const speedMultiplier = Math.sin(elapsed / 50);
        simulatedAcc = {
          x: (Math.random() * 0.8 + 0.3) * speedMultiplier,
          y: (Math.random() * 0.8 + 0.3) * Math.cos(elapsed / 50),
          z: (Math.random() * 0.8 + 0.3) * speedMultiplier,
        };
        simulatedGyro = {
          x: Math.random() * 4.0,
          y: Math.random() * 4.0,
          z: Math.random() * 4.0,
        };
      } 
      else if (type === 'panic') {
        // PANIC MOVEMENT (RUNNING): Repetitive high peaks, moderate rotation
        const gaitCycle = Math.sin((elapsed / 250) * Math.PI); // running gait cycle
        const currentImpact = gaitCycle > 0.8 ? 1.8 : 0.6;
        simulatedAcc = {
          x: Math.random() * 0.4 + 0.1,
          y: currentImpact * (Math.random() * 0.4 + 0.8), // Vertical spikes
          z: Math.random() * 0.4,
        };
        simulatedGyro = {
          x: Math.random() * 3.0,
          y: Math.random() * 2.0,
          z: Math.random() * 2.0,
        };
      }

      // Convert standard G units (1G = 9.81m/s^2) for internal calculation
      const accMag = Math.sqrt(simulatedAcc.x * simulatedAcc.x + simulatedAcc.y * simulatedAcc.y + simulatedAcc.z * simulatedAcc.z) * 9.81;
      const gyroMag = Math.sqrt(simulatedGyro.x * simulatedGyro.x + simulatedGyro.y * simulatedGyro.y + simulatedGyro.z * simulatedGyro.z);

      const formattedAcc = { ...simulatedAcc, mag: accMag };
      const formattedGyro = { ...simulatedGyro, mag: gyroMag };

      // Append and classify
      const classification = classifyMovement(formattedAcc, formattedGyro);

      setSensorState(prev => ({
        ...prev,
        acc: formattedAcc,
        gyro: formattedGyro,
        panicScore: classification.panicScore,
        detectedState: classification.state,
      }));

      updateTelemetry(accMag, gyroMag, classification.panicScore);

      if (elapsed >= duration) {
        clearInterval(simulationTimer.current);
        setSensorState(prev => ({ ...prev, isSimulating: false }));
        // Resume tracking if it was originally active
        startTracking();
      }
    }, interval);
  };

  const resetDetection = () => {
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
    }
    accBuffer.current = [];
    gyroBuffer.current = [];
    setSensorState(prev => ({
      ...prev,
      panicScore: 0,
      detectedState: 'Normal',
      isSimulating: false
    }));
  };

  return (
    <DangerContext.Provider
      value={{
        ...sensorState,
        telemetryHistory,
        startTracking,
        stopTracking,
        simulateDanger,
        resetDetection,
      }}
    >
      {children}
    </DangerContext.Provider>
  );
};
