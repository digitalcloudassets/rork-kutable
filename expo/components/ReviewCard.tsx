import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarRating } from './StarRating';
import { Tokens } from '@/theme/tokens';
import type { Review } from '@/types/models';

interface ReviewCardProps {
  review: Review;
  testID?: string;
}

export function ReviewCard({ review, testID }: ReviewCardProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{review.clientName}</Text>
          <Text style={styles.date}>{formatDate(review.createdAtISO)}</Text>
        </View>
        <StarRating rating={review.rating} readonly size={16} />
      </View>
      
      {review.serviceName && (
        <Text style={styles.serviceName}>{review.serviceName}</Text>
      )}
      
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: Tokens.textMuted,
  },
  serviceName: {
    fontSize: 14,
    color: Tokens.accent,
    fontWeight: '500',
    marginBottom: 8,
  },
  comment: {
    fontSize: 15,
    color: Tokens.text,
    lineHeight: 20,
  },
});