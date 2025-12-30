import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const MainScreen = () => {
  const { theme, tenant, loading, setSchoolCode } = useTheme();
  const [code, setCode] = useState('');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text>Loading School Branding...</Text>
      </View>
    );
  }

  if (!tenant) {
    return (
      <View style={[styles.container, { backgroundColor: '#f3f4f6' }]}>
        <View style={styles.card}>
          <Text style={styles.title}>NucleIQ Connect</Text>
          <Text style={styles.subtitle}>Enter your School Code to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g., myschool"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4f46e5' }]}
            onPress={() => setSchoolCode(code)}
          >
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {tenant.logo_url ? (
        <Image source={{ uri: tenant.logo_url }} style={styles.logo} resizeMode="contain" />
      ) : null}

      <Text style={[styles.schoolName, { color: theme.primary }]}>{tenant.name}</Text>

      <View style={[styles.widget, { backgroundColor: theme.secondary }]}>
        <Text style={styles.widgetText}>📢 Announcements</Text>
      </View>

      <View style={[styles.widget, { backgroundColor: theme.accent }]}>
        <Text style={styles.widgetText}>🚌 Track Bus</Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainScreen />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  schoolName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  widget: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
