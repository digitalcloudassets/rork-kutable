import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Tokens } from '@/theme/tokens';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  testID?: string;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  size = 20, 
  readonly = false,
  testID 
}: StarRatingProps) {
  const handleStarPress = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        const isHalfFilled = star - 0.5 === rating;
        
        return (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            disabled={readonly}
            style={styles.starButton}
            testID={`star-${star}`}
          >
            <Star
              size={size}
              color={isFilled || isHalfFilled ? Tokens.accent : Tokens.textMuted}
              fill={isFilled || isHalfFilled ? Tokens.accent : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
});