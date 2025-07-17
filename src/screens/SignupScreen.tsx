import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SignupData } from '../types';
import { signup, isLoggedIn } from '../utils/auth';

interface SignupScreenProps {
  onSignupSuccess: (email?: string, autoLoggedIn?: boolean) => void;
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    sex: 'male',
    birthday: '',
    weight: 0,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.birthday || !formData.weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.weight <= 0 || formData.weight > 500) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    // Basic date validation (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.birthday)) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    const birthDate = new Date(formData.birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13 || age > 100) {
      Alert.alert('Error', 'Please enter a valid birth date');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting signup with data:', { email: formData.email, name: formData.name });
      const signupResponse = await signup(formData);
      console.log('Signup completed, response keys:', Object.keys(signupResponse));
      
      // Check if user was automatically logged in (token saved during signup)
      const userIsLoggedIn = await isLoggedIn();
      console.log('User auto-logged in after signup:', userIsLoggedIn);
      
      if (userIsLoggedIn) {
        // User was automatically logged in, go directly to app/onboarding
        console.log('Redirecting to app/onboarding after successful signup');
        onSignupSuccess(formData.email, true);
      } else {
        // User needs to log in manually, pre-fill email on login screen
        console.log('No auto-login, redirecting to login screen');
        Alert.alert('Success', 'Account created successfully! Please log in.', [
          { text: 'OK', onPress: () => onSignupSuccess(formData.email, false) }
        ]);
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: keyof SignupData, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const formatDateInput = (text: string) => {
    // If user is deleting (text is shorter than current), allow it
    if (text.length < formData.birthday.length) {
      return text;
    }
    
    // Remove all non-digit characters for new input
    let cleaned = text.replace(/\D/g, '');
    
    // Limit to 8 digits (YYYYMMDD)
    cleaned = cleaned.substring(0, 8);
    
    // Add hyphens automatically
    if (cleaned.length >= 4) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.substring(0, 7) + '-' + cleaned.substring(7);
    }
    
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => updateFormData('name', text)}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sex</Text>
                <View style={styles.sexSelector}>
                  <TouchableOpacity
                    style={[
                      styles.sexButton,
                      formData.sex === 'male' && styles.selectedSex,
                    ]}
                    onPress={() => updateFormData('sex', 'male')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.sexButtonText,
                      formData.sex === 'male' && styles.selectedSexText,
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sexButton,
                      formData.sex === 'female' && styles.selectedSex,
                    ]}
                    onPress={() => updateFormData('sex', 'female')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.sexButtonText,
                      formData.sex === 'female' && styles.selectedSexText,
                    ]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Birth Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.birthday}
                  onChangeText={(text) => updateFormData('birthday', formatDateInput(text))}
                  placeholder="YYYY-MM-DD (e.g., 1990-05-15)"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight ? formData.weight.toString() : ''}
                  onChangeText={(text) => {
                    const numericValue = parseFloat(text) || 0;
                    updateFormData('weight', numericValue);
                  }}
                  placeholder="Enter your weight"
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  placeholder="Enter your password (min 6 characters)"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.disabledButton]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={onNavigateToLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  sexSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
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
    color: '#333',
    fontWeight: '500',
  },
  selectedSexText: {
    color: 'white',
  },
}); 