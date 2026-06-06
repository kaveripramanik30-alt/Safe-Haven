// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys
const KEYS = {
  CONTACTS: '@safehaven_contacts',
  SETTINGS: '@safehaven_settings',
  REPORTS: '@safehaven_reports',
};

// Fallback in-memory storage for web or environments where AsyncStorage fails
const memoryStorage = {};

const safeGetItem = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Storage get error for key ${key}:`, error);
    return memoryStorage[key] || null;
  }
};

const safeSetItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Storage set error for key ${key}:`, error);
    memoryStorage[key] = value;
  }
};

// Initial default contacts
const DEFAULT_CONTACTS = [
  { id: '1', name: 'Emergency Services', phone: '911' },
  { id: '2', name: 'Family Guardian', phone: '1234567890' }
];

export const getContacts = async () => {
  const data = await safeGetItem(KEYS.CONTACTS);
  if (!data) {
    // Seed default contacts
    await saveContacts(DEFAULT_CONTACTS);
    return DEFAULT_CONTACTS;
  }
  return JSON.parse(data);
};

export const saveContacts = async (contacts) => {
  await safeSetItem(KEYS.CONTACTS, JSON.stringify(contacts));
};

export const getSettings = async () => {
  const data = await safeGetItem(KEYS.SETTINGS);
  const defaults = {
    sensitivity: 75,       // 0-100 threshold
    countdownTime: 15,    // 15 seconds default
    soundEnabled: true,
    hapticsEnabled: true,
  };
  if (!data) {
    await saveSettings(defaults);
    return defaults;
  }
  return { ...defaults, ...JSON.parse(data) };
};

export const saveSettings = async (settings) => {
  await safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// Reports persistence (crowd-sourced incidents)
export const getLocalReports = async () => {
  const data = await safeGetItem(KEYS.REPORTS);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveLocalReports = async (reports) => {
  await safeSetItem(KEYS.REPORTS, JSON.stringify(reports));
};

export const addLocalReport = async (report) => {
  const current = await getLocalReports();
  const updated = [report, ...current];
  await saveLocalReports(updated);
  return updated;
};
