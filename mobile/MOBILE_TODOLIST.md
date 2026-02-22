# CircleExchange Mobile Phase 1B: Detailed Task Breakdown & Todo List

**Phase Duration**: 4 Weeks (Months 2.5-3)  
**Target**: Fully functional Android & iOS apps with all Phase 1A features  
**Team**: 2 Mobile Developers  

---

## Table of Contents
1. [Week 9: Mobile Setup & Core Features](#week-9-mobile-setup--core-features)
2. [Week 10: Marketplace & Communities](#week-10-marketplace--communities)
3. [Week 11: Messaging & Real-time Features](#week-11-messaging--real-time-features)
4. [Week 12: Mobile Optimization & App Store Prep](#week-12-mobile-optimization--app-store-prep)

---

## Week 9: Mobile Setup & Core Features

### React Native Project Setup

**Mobile Project Initialization**
- [ ] Initialize React Native project (Expo or bare)
- [ ] Configure TypeScript for React Native
- [ ] Set up folder structure (screens, components, services, store)
- [ ] Create .env and environment configuration
- [ ] Configure ESLint and Prettier
- [ ] Set up Jest and React Native Testing Library
- [ ] Configure Expo development environment (if using Expo)

**Mobile State Management & HTTP Client**
- [ ] Set up Redux Toolkit
- [ ] Create auth slice (for Clerk user state)
- [ ] Create user slice
- [ ] Create communities slice
- [ ] Create listings slice
- [ ] Create messaging slice
- [ ] Configure Axios for React Native with request interceptors
- [ ] Set up error handling and logging
- [ ] Create API service layer

**Mobile Navigation Setup**
- [ ] Install React Navigation
- [ ] Set up bottom tab navigation (Home, Search, Inbox, Profile)
- [ ] Create stack navigators for each tab
- [ ] Set up authentication flow (conditional rendering)
- [ ] Implement navigation state management
- [ ] Handle deep linking (optional)

### Authentication (Mobile with Clerk)

**Clerk Mobile Setup**
- [ ] Install @clerk/clerk-react-native SDK
- [ ] Initialize Clerk in app entry point
- [ ] Configure Clerk publishable key from .env
- [ ] Create Clerk authentication flow UI
- [ ] Implement useAuth hook from Clerk
- [ ] Set up user profile sync to Redux

**Auth Screens & Features**
- [ ] Create Login screen (use Clerk `<SignIn />` or custom with Clerk)
- [ ] Create Register screen (use Clerk `<SignUp />`)
- [ ] Create Email Verification screen (Clerk-managed)
- [ ] Implement OAuth login (Google, GitHub)
- [ ] Implement biometric login with Clerk (optional for MVP+)
- [ ] Create onboarding/profile completion flow after signup
- [ ] Implement logout functionality
- [ ] Handle auth state persistence

### User Profile (Mobile)

**Profile Screens & Features**
- [ ] Create View Profile screen
- [ ] Create Edit Profile screen
- [ ] Create Profile Picture upload (via Supabase Storage API)
- [ ] Create Settings screen
- [ ] Create About/Help screen
- [ ] Implement profile photo from Supabase Storage URL
- [ ] Sync profile edits back to backend/Supabase

**Profile Data Management**
- [ ] Store user data in Redux
- [ ] Sync Clerk user to Supabase user_profiles table
- [ ] Handle profile image uploads with proper loading states
- [ ] Implement error handling for failed uploads

**Week 9 Milestone**: React Native app runs on Android/iOS, Clerk authentication works, user profiles functional, navigation complete

---

## Week 10: Marketplace & Communities

### Marketplace (Mobile)

**Browse Listings**
- [ ] Create Marketplace/Home screen
- [ ] Create Listing List component (fetch from backend API)
- [ ] Create Listing Card component (display Supabase Storage images)
- [ ] Implement infinite scroll/pagination
- [ ] Add search functionality
- [ ] Add basic filters (category, price, condition)
- [ ] Show loading and error states
- [ ] Pull-to-refresh functionality

**Listing Details**
- [ ] Create Listing Detail screen
- [ ] Create Image carousel (Supabase Storage images)
- [ ] Create Listing info section (title, price, description, condition)
- [ ] Create Seller info card with profile photo
- [ ] Add "Message Seller" button (navigation to messaging)
- [ ] Add "Save Listing" button (favorites local storage)
- [ ] Show similar listings
- [ ] Track listing views with PostHog

**Create/Manage Listings**
- [ ] Create Create Listing screen with form
- [ ] Create image picker (take photo or select from gallery)
- [ ] Upload images to Supabase Storage via backend API
- [ ] Show upload progress
- [ ] Create preview before posting
- [ ] Form validation with proper error handling
- [ ] Create My Listings screen
- [ ] Quick edit capability (update listing)
- [ ] Delete confirmation
- [ ] Show listing stats (views, inquiries)

### Communities (Mobile)

**Browse Communities**
- [ ] Create Communities screen
- [ ] Create Community List component
- [ ] Create Community Card component (show logo from Supabase Storage)
- [ ] Implement search functionality
- [ ] Add filtering by category/type
- [ ] Show member count and trust indicators

**Community Details**
- [ ] Create Community Details screen
- [ ] Show community info (name, description, rules)
- [ ] Show member count and join status
- [ ] Create Join/Leave button with confirmation
- [ ] Show community logo from Supabase Storage
- [ ] List community members (first 10, paginated)

**Create Community**
- [ ] Create Create Community screen with form
- [ ] Upload community logo to Supabase Storage
- [ ] Form validation
- [ ] Handle domain-based verification flow
- [ ] Show success/error messages

### Analytics Tracking
- [ ] Set up PostHog for mobile analytics
- [ ] Track: listing viewed, listing created, community joined, message sent
- [ ] Set user properties (user_id, email from Clerk)

**Week 10 Milestone**: Full marketplace on mobile, community management complete, all listing features working, Supabase Storage image handling

---

## Week 11: Messaging & Real-time Features

### Messaging (Mobile)

**Inbox Screen**
- [ ] Create Inbox screen
- [ ] Create Conversation List component
- [ ] Create unread count badge
- [ ] Add conversation search
- [ ] Implement pull-to-refresh

**Chat Screen**
- [ ] Create Chat/Conversation screen
- [ ] Create Message List component
- [ ] Create Message Input component
- [ ] Implement auto-scroll to latest
- [ ] Add message timestamps
- [ ] Add keyboard handling

**Messaging Features**
- [ ] Send text messages via backend HTTP API
- [ ] Mark messages as read (synced with backend)
- [ ] Archive conversations
- [ ] Show unread messages differently
- [ ] Add loading states
- [ ] Handle message images from Supabase Storage

### Clerk Authentication for Mobile
- [ ] Install @clerk/clerk-react-native SDK
- [ ] Integrate Clerk in mobile app
- [ ] Set up OAuth flows (Google, GitHub)
- [ ] Implement biometric login (optional)
- [ ] Sync Clerk user to app state
- [ ] Handle authentication state changes

### Supabase Realtime Integration (replaces Socket.io)
- [ ] Install Supabase Realtime client
- [ ] Set up Supabase Realtime subscriptions for messages
- [ ] Set up Realtime subscriptions for conversations
- [ ] Implement real-time message delivery
- [ ] Implement real-time typing indicators (via Realtime channel)
- [ ] Implement real-time read receipts
- [ ] Handle connection state (online/offline)
- [ ] Implement reconnection logic
- [ ] Handle WebSocket disconnections gracefully
- [ ] Add offline message queue (optional)

### Analytics & Monitoring for Mobile
- [ ] Set up PostHog for mobile analytics
- [ ] Track user events (listing viewed, message sent, etc)
- [ ] Set up Sentry for error tracking
- [ ] Configure Sentry React Native SDK
- [ ] Test error capture and reporting

**Week 11 Milestone**: Mobile messaging complete, Supabase Realtime integrated, real-time updates working, analytics tracking

---

## Week 12: Mobile Optimization & App Store Prep

### Mobile Polish & Optimization

**Performance Optimization**
- [ ] Reduce app bundle size (use tree-shaking, code splitting)
- [ ] Optimize image delivery (lazy load, compression)
- [ ] Implement lazy loading for screens and components
- [ ] Test on low-end devices (measure performance)
- [ ] Optimize app startup time
- [ ] Battery usage optimization (reduce background tasks)
- [ ] Memory leak testing and fixes
- [ ] Profile app performance with DevTools

**Native Features**
- [ ] Implement push notifications (Firebase Cloud Messaging / APNS)
- [ ] Test push notification delivery
- [ ] Implement background sync (optional)
- [ ] Implement camera access for photo uploads
- [ ] Implement file picker
- [ ] Add haptic feedback for interactions
- [ ] Test permissions handling (camera, photo library, notifications)

### Error Tracking & Analytics

**Sentry Integration**
- [ ] Install Sentry React Native SDK
- [ ] Initialize Sentry with DSN from .env
- [ ] Configure error boundaries
- [ ] Track React Navigation errors
- [ ] Set up performance monitoring
- [ ] Test error capture and reporting
- [ ] Configure alerts for critical errors

**PostHog Analytics**
- [ ] Set up PostHog for mobile app
- [ ] Track user events (listing viewed, messaged sent, community joined)
- [ ] Set user properties (user_id, email from Clerk)
- [ ] Create PostHog funnels for key user flows
- [ ] Review analytics dashboards before launch

### Build & Store Preparation

**iOS Build Preparation**
- [ ] Create app icons (all required sizes: 1024x1024, 180x180, 120x120, etc.)
- [ ] Create launch/splash screen assets
- [ ] Create App Store screenshots (min 2-5 per screen, max 5-10)
- [ ] Write compelling app description (200-500 words)
- [ ] Create privacy policy URL (document privacy practices)
- [ ] Create terms of service URL
- [ ] Prepare promotional website/landing page (optional)
- [ ] Configure code signing certificates with Apple
- [ ] Create provisioning profiles for distribution
- [ ] Set Bundle ID and Team ID
- [ ] Configure version number and build number
- [ ] Verify all privacy requirements (GDPR, privacy law compliance)
- [ ] Complete App Store review guidelines checklist

**Android Build Preparation**
- [ ] Create app icons (all required sizes: 512x512, 192x192, 108x108, etc.)
- [ ] Create launch/splash screen assets
- [ ] Create Google Play screenshots (min 2-8 per screen)
- [ ] Create feature graphics (1024x500)
- [ ] Write compelling app description
- [ ] Configure privacy policy URL
- [ ] Declare all necessary permissions properly
- [ ] Generate keystore file and back it up securely
- [ ] Configure signing key alias and password
- [ ] Set Package name (cannot be changed after first release)
- [ ] Configure version code and version name
- [ ] Set target SDK version to latest (Android 14+ recommended)
- [ ] Set minimum SDK version (SDK 21+ recommended for broad compatibility)
- [ ] Complete Google Play content rating questionnaire
- [ ] Review Google Play policies checklist

### Testing & Validation

**Device Testing**
- [ ] Test on iPhone 12 (iOS, medium device)
- [ ] Test on iPhone 14 Pro (iOS, newer device)
- [ ] Test on iPhone SE (iOS, small screen)
- [ ] Test on Pixel 6 (Android, modern)
- [ ] Test on Samsung Galaxy A12 (Android, budget device)
- [ ] Test on Samsung Galaxy S21 (Android, premium device)
- [ ] Test on iPad (tablet - if supported)
- [ ] Test on Android tablet (if supported)

**Edge Cases & Reliability**
- [ ] Test with slow network (3G, latency)
- [ ] Test with intermittent network drops
- [ ] Test offline mode (queue messages, sync when online)
- [ ] Test with 100+ listings loaded
- [ ] Test with 50+ conversation messages
- [ ] Test long app sessions (memory stability)
- [ ] Test background suspend/resume
- [ ] Memory leak testing with heap snapshots
- [ ] Battery drain testing (monitoring background tasks)
- [ ] Crash reporting verification (Sentry)

### Final Checklist Before Submission

**Pre-Launch Review**
- [ ] All features from Week 9-11 tested and working
- [ ] No console errors/warnings
- [ ] All strings localized (if needed)
- [ ] Dark mode tested (if supported)
- [ ] Accessibility tested (colors, text sizes, voiceover)
- [ ] All API endpoints integration tested
- [ ] Clerk authentication fully tested (login, signup, logout, OAuth)
- [ ] Supabase Realtime messaging tested
- [ ] Image uploads working (Supabase Storage)
- [ ] PostHog analytics tracking correctly
- [ ] Sentry error tracking working
- [ ] App icons display correctly on devices
- [ ] Permissions requests working properly
- [ ] App badge count updating correctly
- [ ] Push notifications working (test with backend)
- [ ] App name and description final
- [ ] Screenshots final and approved
- [ ] Version numbers set correctly

**Week 12 Milestone**: Apps production-ready, TestFlight & Google Play submission ready, all features tested

---

## Mobile Components Library

### Navigation Components
- BottomTabNavigator
- StackNavigator
- DrawerNavigator
- Tab Navigation

### Common UI Components
- Button
- TouchableOpacity Wrapper
- Input/TextInput
- Select/Picker
- Checkbox
- Toggle
- Modal
- Alert
- Loading Spinner
- FlatList/ScrollView
- Image Component
- Badge
- Avatar

### Form Components
- Form Wrapper
- FormInput
- FormTextarea
- FormSelect
- FormCheckbox
- FormRadio
- ImagePicker
- DatePicker
- PriceInput
- PasswordInput

### Business Components
- CommunityCard
- ListingCard
- ListingDetail
- ImageCarousel
- SearchBar
- FilterBottomSheet
- ConversationCard
- MessageBubble
- UserProfileCard
- RatingDisplay

---

## Mobile Screens Structure

### Authentication Flow
- Splash Screen
- Login Screen
- Register Screen
- Email Verification Screen
- Password Reset Screen

### Home/Tab Navigation
- **Home Tab**: Marketplace listing feed
- **Search Tab**: Browse, search & filter listings
- **Inbox Tab**: Messaging conversations
- **Profile Tab**: User profile & settings

### Detailed Screens
- Community Browse
- Community Details
- Listing Details
- Create Listing
- Edit Listing
- My Listings
- Conversation Details
- User Profile (self)
- User Profile (other users)
- Settings

---

## Technology Stack (Modern Stack)

**Language**: TypeScript (ES2020+)  
**Framework**: React Native (with Expo or bare)  
**State Management**: Redux Toolkit  
**HTTP Client**: Axios (with request interceptors for Clerk JWT)  
**Navigation**: React Navigation v6 (tab, stack, drawer navigators)  
**Authentication**: Clerk React Native SDK (OAuth, MFA, biometric login)  
**Storage**: AsyncStorage (local key-value) + Supabase Storage (cloud images)  
**Real-time**: Supabase Realtime (WebSocket for messaging - replaces Socket.io)  
**Database Client**: Supabase JS (Realtime subscriptions)  
**Testing**: Jest + React Native Testing Library  
**Images**: React Native Image Crop Picker (camera & gallery access)  
**File Upload**: Supabase Storage SDK (via backend API)  
**Push Notifications**: Firebase Cloud Messaging (Android) / APNS (iOS)  
**Payments**: Stripe React Native SDK (for future payment features)  
**Analytics**: PostHog React Native SDK (product analytics)  
**Error Tracking**: Sentry React Native SDK (error tracking, performance monitoring)  
**Linting**: ESLint
**Formatting**: Prettier  
**Build Tool**: Expo CLI (or bare `react-native` CLI)  
**DNS**: Cloudflare (CDN, SSL, DDoS protection)  
**Domain**: Namecheap (domain registration)  

---

## Mobile File Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── Home/
│   │   │   ├── HomeScreen.tsx (marketplace feed)
│   │   │   └── ListingDetailScreen.tsx
│   │   ├── Search/
│   │   │   ├── SearchScreen.tsx
│   │   │   ├── FilterBottomSheet.tsx
│   │   │   └── CategoryScreen.tsx
│   │   ├── Messaging/
│   │   │   ├── InboxScreen.tsx
│   │   │   ├── ConversationScreen.tsx
│   │   │   └── CreateMessageScreen.tsx
│   │   ├── Listing/
│   │   │   ├── CreateListingScreen.tsx
│   │   │   ├── MyListingsScreen.tsx
│   │   │   └── EditListingScreen.tsx
│   │   ├── Community/
│   │   │   ├── CommunitiesScreen.tsx
│   │   │   ├── CommunityDetailScreen.tsx
│   │   │   └── CreateCommunityScreen.tsx
│   │   └── Profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── EditProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   ├── components/
│   │   ├── Common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Avatar.tsx
│   │   ├── Auth/
│   │   ├── Community/
│   │   │   ├── CommunityCard.tsx
│   │   │   └── CommunitySelector.tsx
│   │   ├── Listing/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── ImageCarousel.tsx
│   │   │   └── ListingForm.tsx
│   │   └── Messaging/
│   │       ├── ConversationCard.tsx
│   │       ├── MessageBubble.tsx
│   │       └── MessageInput.tsx
│   ├── services/
│   │   ├── api/
│   │   │   └── client.ts (Axios instance with Clerk JWT)
│   │   ├── auth.ts (Clerk integration)
│   │   ├── supabase.ts (Realtime client)
│   │   ├── community.ts (API calls)
│   │   ├── listing.ts (API calls)
│   │   ├── messaging.ts (API & Realtime subscriptions)
│   │   ├── storage.ts (Supabase Storage operations)
│   │   └── analytics.ts (PostHog event tracking)
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── communitiesSlice.ts
│   │   │   ├── listingsSlice.ts
│   │   │   └── messagingSlice.ts
│   │   ├── store.ts (configure store)
│   │   └── hooks.ts (useAppDispatch, useAppSelector)
│   ├── hooks/
│   │   ├── useAuth.ts (Clerk auth hook)
│   │   ├── useRealtime.ts (Supabase Realtime subscriptions)
│   │   └── useAsync.ts (generic async operations)
│   ├── utils/
│   │   ├── validators.ts (Zod schemas)
│   │   ├── formatters.ts (price, date formatting)
│   │   └── helpers.ts (utility functions)
│   ├── types/
│   │   ├── index.ts (common types)
│   │   ├── api.ts (API response types)
│   │   └── models.ts (data models)
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── HomeNavigator.tsx
│   │   ├── SearchNavigator.tsx
│   │   ├── MessagingNavigator.tsx
│   │   └── ProfileNavigator.tsx
│   ├── App.tsx (main component with ClerkProvider)
│   └── index.ts (entry point)
├── assets/
│   ├── icons/
│   ├── images/
│   ├── fonts/
│   └── splash/
├── tests/
├── .env.example
├── app.json (Expo config: name, version, icon, splash)
├── package.json (dependencies)
├── tsconfig.json (TypeScript)
├── .gitignore
└── README.md
```

---

## App Store & Play Store Submission Checklist

### iOS (TestFlight Ready)
- [ ] App icons all sizes (1024x1024, 180x180, etc.)
- [ ] Splash screen assets
- [ ] Privacy policy URL configured
- [ ] Terms of service configured
- [ ] App description finalized
- [ ] Screenshots prepared (min 2-5 per screen)
- [ ] Promotional artwork ready
- [ ] Code signing certificates
- [ ] Provisioning profiles
- [ ] Bundle ID configured
- [ ] Version number set
- [ ] Build number configured
- [ ] Privacy policy compliance verified

### Android (Play Console Ready)
- [ ] App icons all sizes (512x512, 192x192, etc.)
- [ ] Splash screen assets
- [ ] Privacy policy URL configured
- [ ] Permissions declared properly
- [ ] App description finalized
- [ ] Screenshots prepared (min 2-8 per screen)
- [ ] Promotional graphic ready
- [ ] Feature graphic ready
- [ ] Keystore file created and backed up
- [ ] Signing key alias configured
- [ ] Package name finalized
- [ ] Version code set
- [ ] Version name set
- [ ] Target SDK configured
- [ ] Minimum SDK configured
- [ ] Content rating questionnaire completed

---

## Success Metrics (End of Phase 1B)

- [ ] Android app installs cleanly and runs on devices
- [ ] iOS app runs on TestFlight on real devices
- [ ] All features from Web Phase 1A working on mobile
- [ ] Clerk authentication complete (login, signup, logout, OAuth)
- [ ] Marketplace fully functional (browse, search, create, edit)
- [ ] Messaging works with Supabase Realtime (real-time updates)
- [ ] Image uploads working (Supabase Storage)
- [ ] App starts in <2s on modern devices
- [ ] App bundle size <100MB (both iOS and Android)
- [ ] Zero crashes on tested devices (Sentry reports clean)
- [ ] 80%+ test coverage for components
- [ ] Lighthouse-equivalent score >85 (performance, accessibility)
- [ ] PostHog analytics tracking user events
- [ ] Sentry error tracking working correctly
- [ ] All required assets prepared for app stores
- [ ] TestFlight and Google Play ready for submission
- [ ] Privacy policy and terms of service URLs configured
- [ ] Permissions properly declared and functioning

---

## Deployment & Release Notes

**Before App Store Submission:**
1. Merge all branches to main
2. Update version number (iOS: Info.plist, Android: build.gradle)
3. Run full test suite - all tests passing
4. Build final APK/IPA on clean machine
5. Test on real devices one more time
6. Tag release in Git: v1.0.0
7. Create release notes for changelog

**Post-Launch Monitoring:**
- Monitor Sentry for crashes
- Review PostHog analytics
- Watch for app review rejection reasons
- Prepare hotfix branch if needed

---

## DevOps Coordination Notes

**Coordinated with Backend Team (Week 11):**
- Stripe payment integration
- Rating & Trust Score System
- Moderation & Reporting endpoints
- Supabase Realtime for real-time messaging
- Push notification webhook setup

**Coordinated with Frontend Team:**
- Shared component patterns (Button, Input, Card, etc.)
- Shared Redux store structure
- Shared authentication flow via Clerk
- Shared API contracts and error handling
- Shared validation schemas (Zod)

---

**Document Version**: 2.0 (Updated with Modern Tech Stack)  
**Created**: February 2026  
**Updated**: With Clerk, Vite, Vercel, Supabase Realtime, PostHog, Sentry  
**Purpose**: Mobile Phase 1B implementation with modern managed services

## App Store & Play Store Submission Checklist

### iOS (TestFlight Ready)
- [ ] App icons all sizes (1024x1024, 180x180, etc.)
- [ ] Splash screen assets
- [ ] Privacy policy URL configured
- [ ] Terms of service configured
- [ ] App description finalized
- [ ] Screenshots prepared (min 2-5 per screen)
- [ ] Promotional artwork ready
- [ ] Code signing certificates
- [ ] Provisioning profiles
- [ ] Bundle ID configured
- [ ] Version number set
- [ ] Build number configured
- [ ] Privacy policy compliance verified

### Android (Play Console Ready)
- [ ] App icons all sizes (512x512, 192x192, etc.)
- [ ] Splash screen assets
- [ ] Privacy policy URL configured
- [ ] Permissions declared properly
- [ ] App description finalized
- [ ] Screenshots prepared (min 2-8 per screen)
- [ ] Promotional graphic ready
- [ ] Feature graphic ready
- [ ] Keystore file created and backed up
- [ ] Signing key alias configured
- [ ] Package name finalized
- [ ] Version code set
- [ ] Version name set
- [ ] Target SDK configured
- [ ] Minimum SDK configured
- [ ] Content rating questionnaire completed

---

## Success Metrics (End of Phase 1B)

- [ ] Android app installs and runs
- [ ] iOS app runs on TestFlight
- [ ] All features from web app working
- [ ] Authentication complete on mobile
- [ ] Marketplace fully functional
- [ ] Messaging works with real-time updates
- [ ] <2s app load time
- [ ] <100MB app size (both platforms)
- [ ] Zero crashes on tested devices
- [ ] 80%+ test coverage
- [ ] App Store submission ready
- [ ] Play Store submission ready

---

## DevOps Coordination Notes

**Coordinated with Backend Team (Week 11):**
- Rating & Trust Score System
- Moderation & Reporting endpoints
- WebSocket integration for real-time messaging

**Coordinated with Frontend Team:**
- Shared component patterns
- Shared state management patterns
- Shared authentication logic
- API contract consistency

---

**Document Version**: 1.0  
**Created**: February 2026  
**Purpose**: Mobile Phase 1B implementation task breakdown
