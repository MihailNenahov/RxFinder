import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from '../utils/storage';

export const ProfileScreen = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    sex: 'male',
    age: 0,
    weight: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await getUserProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    }
  };

  const handleSave = async () => {
    if (!profile.name || !profile.email || !profile.age || !profile.weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    await saveUserProfile(profile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const renderField = (label: string, value: string | number, key: keyof UserProfile) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={(text) => setProfile({ ...profile, [key]: text })}
          keyboardType={key === 'age' || key === 'weight' ? 'numeric' : 'default'}
        />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderField('Name', profile.name, 'name')}
      {renderField('Email', profile.email, 'email')}
      {renderField('Age', profile.age, 'age')}
      {renderField('Weight (kg)', profile.weight, 'weight')}

      {isEditing && (
        <View style={styles.sexSelector}>
          <Text style={styles.label}>Sex</Text>
          <View style={styles.sexButtons}>
            <TouchableOpacity
              style={[
                styles.sexButton,
                profile.sex === 'male' && styles.selectedSex,
              ]}
              onPress={() => setProfile({ ...profile, sex: 'male' })}
            >
              <Text style={styles.sexButtonText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sexButton,
                profile.sex === 'female' && styles.selectedSex,
              ]}
              onPress={() => setProfile({ ...profile, sex: 'female' })}
            >
              <Text style={styles.sexButtonText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: '#000',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  sexSelector: {
    marginBottom: 20,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  sexButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedSex: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sexButtonText: {
    fontSize: 16,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 