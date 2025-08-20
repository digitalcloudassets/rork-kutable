/**
 * Asset Generation Tools for App Store Submission
 * 
 * This file contains utilities and templates for generating required assets:
 * - iOS Screenshots (6.9" iPhone 15 Pro Max)
 * - Android Screenshots (Pixel 6 Pro)
 * - App Store Icons
 * - Feature Graphics
 */

import { Dimensions, Platform } from 'react-native';

// Screen dimensions for different devices
export const DEVICE_DIMENSIONS = {
  // iOS iPhone 15 Pro Max (6.9")
  iOS_6_9: {
    width: 430,
    height: 932,
    name: 'iPhone 15 Pro Max',
    platform: 'iOS' as const,
  },
  
  // Android Pixel 6 Pro
  ANDROID_PIXEL_6_PRO: {
    width: 412,
    height: 915,
    name: 'Pixel 6 Pro',
    platform: 'Android' as const,
  },
} as const;

// Required screenshot sizes for App Store
export const SCREENSHOT_REQUIREMENTS = {
  iOS: {
    '6.9_inch': {
      width: 1320,
      height: 2868,
      description: 'iPhone 15 Pro Max screenshots',
    },
    '6.7_inch': {
      width: 1290,
      height: 2796,
      description: 'iPhone 14 Pro Max screenshots (fallback)',
    },
  },
  Android: {
    phone: {
      width: 1080,
      height: 1920,
      description: 'Android phone screenshots',
    },
    tablet_7: {
      width: 1200,
      height: 1920,
      description: '7-inch tablet screenshots',
    },
    tablet_10: {
      width: 1920,
      height: 1200,
      description: '10-inch tablet screenshots',
    },
  },
} as const;

// App icon sizes
export const ICON_SIZES = {
  iOS: [
    { size: 1024, name: 'App Store', required: true },
    { size: 180, name: 'iPhone App (60pt @3x)', required: true },
    { size: 120, name: 'iPhone App (60pt @2x)', required: true },
    { size: 167, name: 'iPad Pro App (83.5pt @2x)', required: false },
    { size: 152, name: 'iPad App (76pt @2x)', required: false },
    { size: 76, name: 'iPad App (76pt @1x)', required: false },
  ],
  Android: [
    { size: 512, name: 'Play Store', required: true },
    { size: 192, name: 'xxxhdpi', required: true },
    { size: 144, name: 'xxhdpi', required: true },
    { size: 96, name: 'xhdpi', required: true },
    { size: 72, name: 'hdpi', required: true },
    { size: 48, name: 'mdpi', required: true },
  ],
} as const;

/**
 * Screenshot capture configuration
 */
export interface ScreenshotConfig {
  screenName: string;
  description: string;
  setupInstructions?: string[];
  captureDelay?: number;
}

export const REQUIRED_SCREENSHOTS: ScreenshotConfig[] = [
  {
    screenName: 'Explore',
    description: 'Main explore screen showing featured barbers',
    setupInstructions: [
      'Navigate to Explore tab',
      'Ensure barbers are loaded',
      'Show search functionality',
    ],
  },
  {
    screenName: 'Barber Profile',
    description: 'Detailed barber profile with services and gallery',
    setupInstructions: [
      'Open a barber profile',
      'Scroll to show services section',
      'Ensure gallery images are loaded',
    ],
  },
  {
    screenName: 'Booking Flow',
    description: 'Service selection and time booking',
    setupInstructions: [
      'Start booking a service',
      'Show time selection screen',
      'Display available slots',
    ],
  },
  {
    screenName: 'My Bookings',
    description: 'User bookings list with upcoming appointments',
    setupInstructions: [
      'Navigate to Bookings tab',
      'Show upcoming bookings',
      'Display booking details',
    ],
  },
  {
    screenName: 'Barber Dashboard',
    description: 'Barber dashboard with earnings and analytics',
    setupInstructions: [
      'Switch to barber account',
      'Navigate to Dashboard',
      'Show earnings and stats',
    ],
  },
];

/**
 * Feature graphic specifications
 */
export const FEATURE_GRAPHIC = {
  width: 1024,
  height: 500,
  format: 'PNG' as const,
  description: 'Google Play Store feature graphic',
} as const;

/**
 * App Store metadata requirements
 */
export const METADATA_REQUIREMENTS = {
  iOS: {
    appName: { maxLength: 30, required: true },
    subtitle: { maxLength: 30, required: false },
    description: { maxLength: 4000, required: true },
    keywords: { maxLength: 100, required: true },
    supportURL: { required: true },
    privacyPolicyURL: { required: true },
  },
  Android: {
    title: { maxLength: 50, required: true },
    shortDescription: { maxLength: 80, required: true },
    fullDescription: { maxLength: 4000, required: true },
    privacyPolicyURL: { required: true },
  },
} as const;

/**
 * Generate screenshot instructions for manual capture
 */
export function generateScreenshotInstructions(): string {
  const instructions = [
    '# Screenshot Capture Instructions',
    '',
    '## Device Setup',
    '- iOS: Use iPhone 15 Pro Max simulator or device',
    '- Android: Use Pixel 6 Pro emulator or device',
    '- Ensure device is in portrait orientation',
    '- Set device to light mode for consistency',
    '',
    '## Required Screenshots',
    '',
  ];

  REQUIRED_SCREENSHOTS.forEach((config, index) => {
    instructions.push(`### ${index + 1}. ${config.screenName}`);
    instructions.push(`**Description:** ${config.description}`);
    instructions.push('**Setup:**');
    
    if (config.setupInstructions) {
      config.setupInstructions.forEach(instruction => {
        instructions.push(`- ${instruction}`);
      });
    }
    
    instructions.push('');
  });

  instructions.push(
    '## Capture Guidelines',
    '- Use native screenshot functionality (Volume Up + Power)',
    '- Ensure UI is fully loaded before capturing',
    '- Avoid showing personal/test data',
    '- Capture in highest resolution available',
    '- Save screenshots with descriptive names',
    '',
    '## File Naming Convention',
    '- iOS: `ios_screenshot_01_explore.png`',
    '- Android: `android_screenshot_01_explore.png`',
    '',
    '## Upload Requirements',
    '- iOS: Upload to App Store Connect',
    '- Android: Upload to Google Play Console',
    '- Minimum 3 screenshots, maximum 10 per device type',
  );

  return instructions.join('\n');
}

/**
 * Generate app store description template
 */
export function generateAppStoreDescription(): {
  iOS: string;
  Android: string;
} {
  const baseDescription = `Kutable is the premier platform connecting clients with professional barbers for convenient, high-quality grooming services.

🔍 DISCOVER TALENTED BARBERS
Browse profiles of skilled barbers in your area, complete with portfolios, reviews, and service offerings.

📅 EASY BOOKING
Book appointments instantly with real-time availability. Choose your preferred time and service with just a few taps.

💳 SECURE PAYMENTS
Safe and secure payment processing with multiple payment options. No cash needed.

📱 MANAGE APPOINTMENTS
View upcoming bookings, reschedule when needed, and receive notifications about your appointments.

⭐ REVIEWS & RATINGS
Read authentic reviews from other clients and leave feedback to help the community.

FOR BARBERS:
📊 Business Dashboard
Track earnings, manage services, and view analytics to grow your business.

📸 Portfolio Gallery
Showcase your work with a professional gallery that attracts new clients.

🗓️ Availability Management
Set your schedule and manage bookings with our intuitive calendar system.

💰 Direct Payments
Receive payments directly with transparent fee structure and fast payouts.`;

  return {
    iOS: baseDescription,
    Android: `${baseDescription}

Download Kutable today and experience the future of barber services!`,
  };
}

/**
 * Generate privacy policy and terms URLs
 */
export const LEGAL_URLS = {
  privacyPolicy: 'https://kutable.com/privacy',
  termsOfService: 'https://kutable.com/terms',
  support: 'https://kutable.com/support',
} as const;

/**
 * App Store keywords for iOS
 */
export const APP_STORE_KEYWORDS = [
  'barber',
  'haircut',
  'grooming',
  'appointment',
  'booking',
  'salon',
  'beauty',
  'men',
  'style',
  'professional',
].join(',');

/**
 * Brand colors for consistent design
 */
export const BRAND_COLORS = {
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  secondary: '#34C759',
  accent: '#FF9500',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  text: '#1D1D1F',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  surface: '#FFFFFF',
} as const;

/**
 * Current device info helper
 */
export function getCurrentDeviceInfo() {
  const { width, height } = Dimensions.get('window');
  const platform = Platform.OS;
  
  return {
    width,
    height,
    platform,
    isTablet: width >= 768,
    aspectRatio: width / height,
  };
}

/**
 * Generate icon template instructions
 */
export function generateIconTemplate(): string {
  return `# App Icon Design Template

## Design Guidelines
- Use the Kutable brand colors: Primary #007AFF, Secondary #34C759
- Include scissors or barber pole iconography
- Ensure readability at small sizes (48px)
- Use rounded corners (iOS will apply automatically)
- Avoid text in the icon
- Use high contrast for visibility

## Required Sizes
### iOS
- 1024x1024px (App Store)
- 180x180px (iPhone @3x)
- 120x120px (iPhone @2x)

### Android
- 512x512px (Play Store)
- 192x192px (xxxhdpi)
- 144x144px (xxhdpi)
- 96x96px (xhdpi)
- 72x72px (hdpi)
- 48x48px (mdpi)

## Export Settings
- Format: PNG with transparency
- Color space: sRGB
- No compression for store assets
- Optimize for web for smaller sizes`;
}

/**
 * Generate feature graphic template
 */
export function generateFeatureGraphicTemplate(): string {
  return `# Feature Graphic Template (Android)

## Specifications
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- No transparency
- Safe area: Keep important content within 924 x 400 pixels (50px margin)

## Content Guidelines
- App name: "Kutable"
- Tagline: "Professional Barber Services On-Demand"
- Include app icon
- Use brand colors and fonts
- Show key app features visually
- Avoid cluttered design

## Design Elements
- Background: Gradient using brand colors
- Typography: Clean, modern sans-serif
- Icons: Barber tools, calendar, mobile phone
- Layout: Left-aligned text, right-aligned visuals`;
}

/**
 * Screenshot naming convention
 */
export function generateScreenshotNames(platform: 'ios' | 'android'): string[] {
  const screens = [
    'explore',
    'barber_profile',
    'booking_flow',
    'my_bookings',
    'barber_dashboard'
  ];
  
  return screens.map((screen, index) => 
    `${platform}_screenshot_${String(index + 1).padStart(2, '0')}_${screen}.png`
  );
}

/**
 * Generate app store optimization tips
 */
export function generateASOTips(): string {
  return `# App Store Optimization (ASO) Tips

## Keywords Strategy
### Primary Keywords
- barber
- haircut
- grooming
- appointment
- booking

### Long-tail Keywords
- "barber near me"
- "book haircut appointment"
- "professional grooming services"
- "mobile barber booking"

## Screenshot Optimization
1. **First Screenshot**: Most important - shows main value proposition
2. **Sequence**: Tell a story from discovery to booking completion
3. **Text Overlays**: Add benefit-focused captions
4. **Localization**: Consider different languages for global markets

## Description Optimization
- Front-load important keywords in first 2-3 lines
- Use bullet points for easy scanning
- Include social proof (ratings, downloads)
- End with clear call-to-action

## Conversion Rate Optimization
- A/B test different icon designs
- Monitor keyword rankings weekly
- Respond to reviews within 24 hours
- Update screenshots with new features
- Seasonal promotions in description`;
}

/**
 * Generate store listing checklist
 */
export function generateStoreListingChecklist(): { ios: string[]; android: string[] } {
  const commonItems = [
    'App name optimized for search',
    'Description includes primary keywords',
    'Screenshots tell compelling story',
    'App icon is distinctive and memorable',
    'Privacy policy URL is accessible',
    'Support contact information provided',
    'App category accurately selected',
    'Age rating appropriate for content',
    'Pricing strategy determined',
    'Release notes prepared'
  ];

  const iosSpecific = [
    'Subtitle under 30 characters',
    'Keywords under 100 characters',
    'Promotional text updated',
    'App Store Connect screenshots uploaded',
    'TestFlight testing completed',
    'In-app purchases configured (if applicable)'
  ];

  const androidSpecific = [
    'Short description under 80 characters',
    'Feature graphic uploaded',
    'Content rating questionnaire completed',
    'Target API level requirements met',
    'App signing key secured',
    'Google Play Console screenshots uploaded'
  ];

  return {
    ios: [...commonItems, ...iosSpecific],
    android: [...commonItems, ...androidSpecific]
  };
}