// src/components/ContactManager.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Keyboard } from 'react-native';
import { getContacts, saveContacts } from '../utils/storage';
import { COLORS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function ContactManager() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const list = await getContacts();
    setContacts(list);
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, ''); // Allow digits and + prefix
    if (cleanPhone.length < 3) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: cleanPhone,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    await saveContacts(updated);
    
    setName('');
    setPhone('');
    setShowAddForm(false);
    Keyboard.dismiss();
  };

  const handleDeleteContact = async (id) => {
    // Cannot delete the primary emergency service line for safety demonstration
    const contactToDelete = contacts.find(c => c.id === id);
    if (contactToDelete && contactToDelete.phone === '911') {
      Alert.alert('Restricted', 'System emergency dispatch (911) cannot be removed.');
      return;
    }

    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await saveContacts(updated);
  };

  const renderContactItem = ({ item, index }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {index === 0 && <Text style={styles.primaryTag}>Primary SOS Destination</Text>}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDeleteContact(item.id)}
      >
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>{showAddForm ? 'Cancel' : '+ Add Contact'}</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={COLORS.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={15}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddContact}>
            <Text style={styles.submitButtonText}>Save Guardian</Text>
          </TouchableOpacity>
        </View>
      )}

      {contacts.length === 0 ? (
        <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.id}
          renderItem={renderContactItem}
          scrollEnabled={false} // Disable inner scrolling as it is placed inside a scrollable screen
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderColor: COLORS.surfaceLight,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  addButtonText: {
    color: COLORS.info,
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: SPACING.xs,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  contactPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  primaryTag: {
    color: COLORS.safe,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  deleteButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.lg,
    fontSize: 13,
  },
});
