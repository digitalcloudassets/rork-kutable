# Kutable - Store Submission Assets & Guidelines

This document provides comprehensive instructions for generating assets and preparing the Kutable app for App Store and Google Play Store submission.

## 📱 App Store Assets

### Required Screenshots

#### iOS (iPhone 15 Pro Max - 6.9")
- **Resolution:** 1320 x 2868 pixels
- **Format:** PNG or JPEG
- **Quantity:** 3-10 screenshots

#### Android (Various Devices)
- **Phone:** 1080 x 1920 pixels minimum
- **7" Tablet:** 1200 x 1920 pixels
- **10" Tablet:** 1920 x 1200 pixels

### Screenshot Capture Instructions

1. **Setup Device**
   - Use iPhone 15 Pro Max simulator or Pixel 6 Pro emulator
   - Set to light mode for consistency
   - Ensure stable internet connection for data loading

2. **Required Screenshots**
   - **Explore Screen:** Main barber discovery with search
   - **Barber Profile:** Detailed profile with services and gallery
   - **Booking Flow:** Service selection and time booking
   - **My Bookings:** User bookings with upcoming appointments
   - **Barber Dashboard:** Earnings and analytics (barber view)

3. **Capture Process**
   - Navigate to each screen following setup instructions
   - Wait for all content to load completely
   - Use device screenshot function (Volume Up + Power)
   - Save with descriptive names: `ios_01_explore.png`

### App Icons

#### iOS Requirements
- **App Store:** 1024x1024px (required)
- **iPhone App:** 180x180px (@3x), 120x120px (@2x)
- **iPad App:** 167x167px (@2x), 152x152px (@2x), 76x76px (@1x)

#### Android Requirements
- **Play Store:** 512x512px (required)
- **Launcher Icons:** 192px (xxxhdpi), 144px (xxhdpi), 96px (xhdpi), 72px (hdpi), 48px (mdpi)

### Feature Graphic (Android)
- **Size:** 1024 x 500 pixels
- **Format:** PNG
- **Content:** Showcase app features with branding

## 📝 App Store Metadata

### iOS App Store Connect

#### App Information
- **App Name:** Kutable (max 30 characters)
- **Subtitle:** Professional Barber Booking (max 30 characters)
- **Keywords:** barber,haircut,grooming,appointment,booking,salon,beauty,men,style,professional

#### Description
```
Kutable is the premier platform connecting clients with professional barbers for convenient, high-quality grooming services.

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
Receive payments directly with transparent fee structure and fast payouts.
```

#### URLs
- **Privacy Policy:** https://kutable.com/privacy
- **Terms of Service:** https://kutable.com/terms
- **Support URL:** https://kutable.com/support

### Google Play Console

#### Store Listing
- **App Title:** Kutable - Barber Booking (max 50 characters)
- **Short Description:** Book professional barber services instantly (max 80 characters)
- **Full Description:** [Same as iOS with additional call-to-action]

## 🛡️ Privacy & Legal Compliance

### Privacy Policy Requirements
- Data collection practices
- Third-party integrations (Stripe, analytics)
- User rights and data deletion
- Contact information for privacy inquiries

### Terms of Service Requirements
- Service usage terms
- Payment and refund policies
- User responsibilities
- Liability limitations

### Age Rating
- **iOS:** 4+ (No objectionable content)
- **Android:** Everyone (Suitable for all ages)

## 🔧 Technical Requirements

### App Store Review Guidelines Compliance

#### iOS
- ✅ Uses native iOS design patterns
- ✅ Handles network failures gracefully
- ✅ Includes proper error states
- ✅ Respects user privacy
- ✅ No crashes or major bugs

#### Android
- ✅ Follows Material Design guidelines
- ✅ Handles Android back button properly
- ✅ Supports different screen sizes
- ✅ Includes proper permissions
- ✅ No security vulnerabilities

### Performance Checklist
- [ ] App launches in under 3 seconds
- [ ] Smooth scrolling and animations
- [ ] Proper loading states
- [ ] Offline functionality where appropriate
- [ ] Memory usage optimization

## 📊 Analytics & Monitoring

### Crash Reporting
- Error boundaries implemented
- Comprehensive error logging
- User-friendly error messages
- Recovery mechanisms

### Performance Monitoring
- App launch time tracking
- Screen load time monitoring
- User flow analytics
- Conversion rate tracking

## 🚀 Submission Process

### Pre-Submission Checklist
- [ ] All screenshots captured and optimized
- [ ] App icons generated for all required sizes
- [ ] Metadata written and reviewed
- [ ] Privacy policy and terms published
- [ ] App tested on multiple devices
- [ ] Performance optimized
- [ ] Error handling verified

### iOS Submission Steps
1. Archive app in Xcode
2. Upload to App Store Connect
3. Fill in app metadata
4. Upload screenshots and icons
5. Set pricing and availability
6. Submit for review

### Android Submission Steps
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Complete store listing
4. Upload assets and screenshots
5. Set content rating
6. Submit for review

## 🎨 Design Assets

### Brand Colors
- **Primary:** #007AFF (iOS Blue)
- **Secondary:** #34C759 (Success Green)
- **Error:** #FF3B30 (Error Red)
- **Background:** #F8F9FA (Light Gray)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android)
- **Body:** SF Pro Text (iOS) / Roboto (Android)
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

### Icon Style
- **Style:** Rounded, modern, minimal
- **Colors:** Monochrome with brand accent
- **Size:** Scalable vector format preferred

## 📞 Support & Contact

### Developer Contact
- **Email:** developer@kutable.com
- **Support:** https://kutable.com/support
- **Privacy:** privacy@kutable.com

### Review Response Strategy
- Monitor reviews daily
- Respond to feedback within 24 hours
- Address technical issues promptly
- Thank users for positive feedback

---

## 🔄 Version Updates

### Release Notes Template
```
What's New in Kutable v1.0.1:

🐛 Bug Fixes
- Fixed booking confirmation display
- Improved app stability

✨ Improvements
- Faster barber search
- Enhanced user experience

📱 Coming Soon
- Push notifications
- Advanced filtering
```

### Update Frequency
- **Major Updates:** Monthly feature releases
- **Minor Updates:** Bi-weekly bug fixes
- **Hotfixes:** As needed for critical issues

---

*Last updated: January 2025*
*Version: 1.0.0*