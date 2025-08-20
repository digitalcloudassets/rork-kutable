import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { brandColors } from '../config/brand';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  testID?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again or contact support if the problem persists.',
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
  testID,
}: ErrorStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <AlertTriangle size={64} color="#EF4444" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
          testID={`${testID}-retry`}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={20} color="#fff" />
          )}
          <Text style={styles.retryButtonText}>
            {isRetrying ? 'Retrying...' : retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});