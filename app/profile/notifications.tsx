import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, Platform, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '@/utils/usePushNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { Tokens } from '@/theme/tokens';

interface NotificationSettings {
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  newBookings: boolean;
  paymentNotifications: boolean;
  marketingMessages: boolean;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { expoPushToken, registerForPushNotifications } = usePushNotifications();
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [settings, setSettings] = useState<NotificationSettings>({
    bookingConfirmations: true,
    bookingReminders: true,
    newBookings: user?.role === 'barber',
    paymentNotifications: user?.role === 'barber',
    marketingMessages: false,
  });

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('not-supported');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Push notifications are not supported on web.');
      return;
    }

    try {
      await registerForPushNotifications();
      await checkPermissionStatus();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Open Settings',
        'To enable notifications, please go to Settings > Notifications > Kutable and turn on Allow Notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Linking.openSettings();
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    if (permissionStatus !== 'granted' && value) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications first to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestPermissions },
        ]
      );
      return;
    }

    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderPermissionStatus = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Web Platform</Text>
          <Text style={styles.statusText}>
            Push notifications are not supported on web. Use the mobile app for notifications.
          </Text>
        </View>
      );
    }

    switch (permissionStatus) {
      case 'granted':
        return (
          <View style={[styles.statusCard, styles.statusGranted]}>
            <Text style={styles.statusTitle}>✅ Notifications Enabled</Text>
            <Text style={styles.statusText}>
              You&apos;ll receive notifications based on your preferences below.
            </Text>
            {expoPushToken && (
              <Text style={styles.tokenText}>
                Token: {expoPushToken.substring(0, 20)}...
              </Text>
            )}
          </View>
        );
      case 'denied':
        return (
          <View style={[styles.statusCard, styles.statusDenied]}>
            <Text style={styles.statusTitle}>❌ Notifications Disabled</Text>
            <Text style={styles.statusText}>
              Notifications are disabled. Tap below to open settings and enable them.
            </Text>
            <Text style={styles.linkText} onPress={openSettings}>
              Open Settings
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>🔔 Enable Notifications</Text>
            <Text style={styles.statusText}>
              Get notified about bookings, reminders, and important updates.
            </Text>
            <Text style={styles.linkText} onPress={requestPermissions}>
              Enable Notifications
            </Text>
          </View>
        );
    }
  };

  const renderSettingRow = (key: keyof NotificationSettings, title: string, description: string) => {
    const isEnabled = permissionStatus === 'granted' && Platform.OS !== 'web';
    
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, !isEnabled && styles.disabledText]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, !isEnabled && styles.disabledText]}>
            {description}
          </Text>
        </View>
        <Switch
          value={settings[key]}
          onValueChange={(value) => updateSetting(key, value)}
          disabled={!isEnabled}
          trackColor={{ false: Tokens.border, true: Tokens.accent }}
          thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerStyle: { backgroundColor: Tokens.bg },
          headerTintColor: Tokens.text,
        }} 
      />
      
      <ScrollView style={styles.content}>
        {renderPermissionStatus()}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          {renderSettingRow(
            'bookingConfirmations',
            'Booking Confirmations',
            'Get notified when your bookings are confirmed'
          )}
          
          {renderSettingRow(
            'bookingReminders',
            'Appointment Reminders',
            'Receive reminders before your appointments'
          )}
          
          {user?.role === 'barber' && renderSettingRow(
            'newBookings',
            'New Bookings',
            'Get notified when clients book appointments'
          )}
          
          {user?.role === 'barber' && renderSettingRow(
            'paymentNotifications',
            'Payment Notifications',
            'Receive notifications about payments and payouts'
          )}
          
          {renderSettingRow(
            'marketingMessages',
            'Marketing Messages',
            'Receive updates about new features and promotions'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  content: {
    flex: 1,
    padding: Tokens.spacing.md,
  },
  statusCard: {
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.borderRadius.lg,
    padding: Tokens.spacing.lg,
    marginBottom: Tokens.spacing.lg,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  statusGranted: {
    borderColor: Tokens.success,
    backgroundColor: Tokens.success + '10',
  },
  statusDenied: {
    borderColor: Tokens.error,
    backgroundColor: Tokens.error + '10',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: Tokens.spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: Tokens.textMuted,
    lineHeight: 20,
  },
  tokenText: {
    fontSize: 12,
    color: Tokens.textMuted,
    marginTop: Tokens.spacing.sm,
    fontFamily: 'monospace',
  },
  linkText: {
    fontSize: 14,
    color: Tokens.accent,
    fontWeight: '600',
    marginTop: Tokens.spacing.sm,
  },
  section: {
    marginBottom: Tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: Tokens.spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  settingContent: {
    flex: 1,
    marginRight: Tokens.spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Tokens.text,
    marginBottom: Tokens.spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
    lineHeight: 18,
  },
  disabledText: {
    opacity: 0.5,
  },
});