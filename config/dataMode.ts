export const DATA_MODE = (process.env.EXPO_PUBLIC_DATA_MODE || 'live') as 'live' | 'mock';

export const isLiveMode = () => DATA_MODE === 'live';
export const isMockMode = () => DATA_MODE === 'mock';

// Helper to log data mode fallbacks
export const logFallback = (endpoint: string, error?: any) => {
  if (isLiveMode()) {
    console.warn(`API ${endpoint} failed, falling back to mock data:`, error?.message || error);
  }
};