import { env } from './env';

export const DATA_MODE = env.DATA_MODE;

export const isLiveMode = () => DATA_MODE === 'live';
export const isMockMode = () => DATA_MODE === 'mock';

// Helper to log data mode fallbacks
export const logFallback = (endpoint: string, error?: any) => {
  if (isLiveMode()) {
    console.warn(`Network error - falling back to mock data`);
    console.log(`API ${endpoint} failed:`, error?.message || error);
  } else {
    console.log(`Using mock data for ${endpoint} (mock mode enabled)`);
  }
};