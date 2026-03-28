import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react-native';
import { BRAND } from '../config/brand';

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

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  testID?: string;
}

export function InlineError({ message, onDismiss, testID }: InlineErrorProps) {
  return (
    <View style={styles.inlineContainer} testID={testID}>
      <AlertCircle size={16} color="#EF4444" />
      <Text style={styles.inlineMessage}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Helper function to get user-friendly error messages
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Not signed in')) {
      return 'Please sign in to continue';
    }
    if (error.message.includes('overlaps')) {
      return error.message;
    }
    if (error.message.includes('confirmed bookings')) {
      return error.message;
    }
    if (error.message.includes('Failed to')) {
      return error.message;
    }
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
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
    color: BRAND.TEXT_PRIMARY,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: BRAND.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
    gap: 8,
  },
  inlineMessage: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: '600',
  },
});