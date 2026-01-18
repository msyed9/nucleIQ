# NucleiQ Mobile App

A comprehensive React Native Expo mobile application for the NucleiQ School Management System.

## 📱 Features

This mobile app provides access to all modules of the NucleiQ platform:

### Core Modules
- **Dashboard** - Overview with stats, charts, quick actions, and recent activity
- **Students** - List, add, edit, view details, documents, and remarks
- **Attendance** - Mark attendance by class/section with QR scanning support
- **Fees** - Collect fees, view payment history, defaulters, and student ledger

### Staff & HR
- Staff list and profile management
- Leave management and approval
- Payslips and salary information

### Academics
- Timetable viewing
- Exam schedules and results
- Assignments management
- Learning outcomes tracking

### ID Cards
- Template management
- QR code scanning for verification
- Bulk ID card generation

### Communication
- Notice board
- Message composer
- Push notifications

### Finance
- Finance dashboard
- Expense tracking
- Vendor management
- Budget overview

### Operations
- Library - Book catalog and circulation
- Transport - Routes and vehicle management
- Hostel - Room allocation and mess management
- Inventory - Stock and purchase orders

### Additional Modules
- CRM Lead Board
- Calendar & Events
- Salah & Habit Trackers
- Helpdesk ticketing
- Reports & Analytics
- Settings & Preferences

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:8000/api'  // Replace with your local IP
  : 'https://api.nucleiq.com/api';
```

4. Start the development server:
```bash
npm start
```

5. Run on Android:
```bash
npm run android
```

### Building for Production

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure EAS:
```bash
eas build:configure
```

3. Build Android APK:
```bash
eas build --platform android --profile preview
```

4. Build Android AAB (for Play Store):
```bash
eas build --platform android --profile production
```

## 📁 Project Structure

```
mobile/
├── App.tsx                 # Main entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── babel.config.js        # Babel config
├── assets/                # App icons and images
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── src/
    ├── components/        # Reusable components
    │   ├── common/       # Shared components
    │   └── navigation/   # Navigation components
    ├── contexts/          # React contexts
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── navigation/        # Navigation configuration
    │   ├── RootNavigator.tsx
    │   ├── MainTabNavigator.tsx
    │   └── stacks/        # Stack navigators
    ├── screens/           # Screen components
    │   ├── auth/
    │   ├── dashboard/
    │   ├── students/
    │   ├── attendance/
    │   ├── fees/
    │   └── ... (other modules)
    ├── services/          # API services
    │   └── api.ts
    └── theme/             # Theme configuration
        └── paperTheme.ts
```

## 🎨 Design System

The app uses Material Design 3 with React Native Paper, featuring:
- Custom NucleiQ brand colors (Navy Blue, Forest Green, Vibrant Orange)
- Light and dark mode support
- Consistent typography and spacing
- Premium UI components with subtle animations

## 🔐 Authentication

- JWT-based authentication with access and refresh tokens
- Secure token storage using AsyncStorage
- Automatic token refresh on 401 responses
- Role-based access control

## 📲 Key Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Development and build platform
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components
- **TanStack Query** - API state management
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **React Native Chart Kit** - Charts and graphs

## 🔧 Configuration

### Environment Variables
The app uses different API endpoints for development and production:
- Development: Local backend server
- Production: Cloud-hosted API

### Customization
- Update branding in `src/theme/paperTheme.ts`
- Modify navigation in `src/navigation/` files
- Add new modules by creating screens and updating navigation stacks

## 📝 Notes

- The app connects to the same Django backend as the web application
- All API endpoints are shared between web and mobile
- Multi-tenant support with X-Tenant-ID header
- Real-time notifications via push notifications (Firebase/Expo)

## 🆘 Support

For issues or questions, please contact the development team or check the main NucleiQ documentation.
