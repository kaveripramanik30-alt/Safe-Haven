// src/screens/AlertsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Keyboard, Alert } from 'react-native';
import { getLocalReports, addLocalReport } from '../utils/storage';
import { START_COORDS } from '../components/MapViewer';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function AlertsScreen() {
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('lighting'); // lighting, crowd, harassment, other
  const [severity, setSeverity] = useState('Medium'); // Low, Medium, High

  const categories = [
    { id: 'lighting', label: '💡 Low Light', color: COLORS.warning },
    { id: 'crowd', label: '👥 Crowd Density', color: COLORS.info },
    { id: 'harassment', label: '🚶 Threat/Harassment', color: COLORS.danger },
    { id: 'other', label: '⚠️ Other Hazard', color: COLORS.textSecondary }
  ];

  const severities = ['Low', 'Medium', 'High'];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const list = await getLocalReports();
    // Default seed reports if empty
    if (list.length === 0) {
      const seed = [
        {
          id: 's1',
          title: 'Unlit Alley near Valencia',
          description: 'All 3 streetlights on this block are completely burned out. Very dark.',
          category: 'lighting',
          severity: 'High',
          time: '3 hours ago',
          coords: { latitude: 37.7660, longitude: -122.4160 }
        },
        {
          id: 's2',
          title: 'Suspicious Crowd Gathering',
          description: 'Large aggressive group blocking the entrance to the park path.',
          category: 'harassment',
          severity: 'High',
          time: '1 hour ago',
          coords: { latitude: 37.7710, longitude: -122.4210 }
        }
      ];
      setReports(seed);
      // Save seed to storage
      await addLocalReport(seed[0]);
      await addLocalReport(seed[1]);
    } else {
      setReports(list);
    }
  };

  const handleReportSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please enter a title and description.');
      return;
    }

    // Generate random coordinate offset around user location to simulate map pinning
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;

    const newReport = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      time: 'Just now',
      coords: {
        latitude: START_COORDS.latitude + latOffset,
        longitude: START_COORDS.longitude + lngOffset,
      }
    };

    const updated = await addLocalReport(newReport);
    setReports(updated);

    setTitle('');
    setDescription('');
    setCategory('lighting');
    setSeverity('Medium');
    Keyboard.dismiss();
    Alert.alert('Report Filed', 'Thank you. Your safety alert is now live and has updated route risk factors.');
  };

  const getCategoryLabel = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.label : 'Alert';
  };

  const getCategoryColor = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : COLORS.textMuted;
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.itemHeader}>
        <View style={[styles.catTag, { backgroundColor: getCategoryColor(item.category) + '15', borderColor: getCategoryColor(item.category) }]}>
          <Text style={[styles.catTagText, { color: getCategoryColor(item.category) }]}>
            {getCategoryLabel(item.category)}
          </Text>
        </View>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemDesc}>{item.description}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.severityText}>
          Severity:{' '}
          <Text style={{ color: item.severity === 'High' ? COLORS.danger : item.severity === 'Medium' ? COLORS.warning : COLORS.safe, fontWeight: '800' }}>
            {item.severity}
          </Text>
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* File a Report Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Pin Danger/Incident Report</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Incident Title (e.g. Unlit Crosswalk)"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={40}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed Description (what did you notice?)"
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={3}
          maxLength={200}
        />

        {/* Category Selector */}
        <Text style={styles.label}>Select Category</Text>
        <View style={styles.buttonGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.gridBtn,
                category === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' }
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={[styles.gridBtnText, category === cat.id && { color: cat.color, fontWeight: '700' }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity Selector */}
        <Text style={styles.label}>Threat Level</Text>
        <View style={styles.btnRow}>
          {severities.map((sev) => (
            <TouchableOpacity
              key={sev}
              style={[
                styles.sevBtn,
                severity === sev && { 
                  borderColor: sev === 'High' ? COLORS.danger : sev === 'Medium' ? COLORS.warning : COLORS.safe,
                  backgroundColor: (sev === 'High' ? COLORS.danger : sev === 'Medium' ? COLORS.warning : COLORS.safe) + '15'
                }
              ]}
              onPress={() => setSeverity(sev)}
            >
              <Text style={[
                styles.sevBtnText, 
                severity === sev && { 
                  color: sev === 'High' ? COLORS.danger : sev === 'Medium' ? COLORS.warning : COLORS.safe,
                  fontWeight: '800' 
                }
              ]}>
                {sev}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleReportSubmit}>
          <Text style={styles.submitBtnText}>🚨 Publish Alert to Safety Map</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Feed Logs */}
      <View style={styles.feedContainer}>
        <Text style={styles.sectionTitle}>Live Safety Broadcast</Text>
        
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>Safety feed is clear. No reported incidents nearby.</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={item => item.id}
            renderItem={renderReportItem}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
  formCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  gridBtn: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sevBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  sevBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  submitBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitBtnText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  feedContainer: {
    width: '100%',
  },
  listContainer: {
    gap: SPACING.sm,
  },
  reportItem: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  catTag: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  catTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2,
  },
  itemDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginVertical: SPACING.xs,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingTop: SPACING.xs,
    marginTop: SPACING.xs,
  },
  severityText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
