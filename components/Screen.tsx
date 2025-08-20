import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { Tokens } from '@/theme/tokens';

interface ScreenProps extends SafeAreaViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
}

export function Screen({ 
  children, 
  style, 
  scrollable = false, 
  scrollViewProps,
  ...rest 
}: ScreenProps) {
  const baseStyle = {
    flex: 1,
    backgroundColor: Tokens.bg,
  };

  if (scrollable) {
    return (
      <SafeAreaView 
        style={[baseStyle, style]} 
        edges={['top', 'right', 'left']} 
        {...rest}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: Tokens.bg }}
          contentContainerStyle={{ backgroundColor: Tokens.bg }}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[baseStyle, style]} 
      edges={['top', 'right', 'left']} 
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
}

// Convenience wrapper for screens that need scrolling
export function ScrollScreen({ children, ...props }: Omit<ScreenProps, 'scrollable'>) {
  return (
    <Screen scrollable {...props}>
      {children}
    </Screen>
  );
}