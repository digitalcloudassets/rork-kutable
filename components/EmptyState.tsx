import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { BRAND } from '../config/brand';
import { Tokens } from '../theme/tokens';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

interface EmptyCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Icon size={64} color={BRAND.TEXT_SECONDARY || Tokens.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          testID={`${testID}-action`}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyCard({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  testID,
}: EmptyCardProps) {
  return (
    <View style={styles.cardContainer} testID={testID}>
      <Icon size={48} color={Tokens.textMuted} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.cardActionButton}
          onPress={onAction}
          testID={`${testID}-action`}
        >
          <Text style={styles.cardActionButtonText}>{actionLabel}</Text>
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
    color: BRAND.TEXT_PRIMARY || Tokens.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY || Tokens.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: BRAND.ACCENT || Tokens.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: BRAND.TEXT_PRIMARY || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: Tokens.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.border,
    margin: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: Tokens.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  cardActionButton: {
    backgroundColor: Tokens.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cardActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});