# NucleiQ Mobile App: Build & Configuration Guide

This guide provides step-by-step instructions to configure the NucleiQ mobile app for your school and build the Android APK.

## 1. Configure Backend Connection

The mobile app needs to know where your NucleiQ server is running.

1.  Open `mobile/src/services/api.ts`.
2.  Locate the `API_BASE_URL` constant.
3.  Update it based on your environment:
    *   **Android Emulator**: Use `http://10.0.2.2:8000/api`
    *   **Physical Device (Wifi)**: Use your computer's local IP, e.g., `http://192.168.1.15:8000/api`
    *   **Production**: Use your live domain, e.g., `https://api.yourdomain.com/api`

```typescript
const API_BASE_URL = __DEV__
    ? 'http://10.0.2.2:8000/api'  // For Emulator
    : 'https://api.nucleiq.com/api';
```

## 2. Customize App Branding

To change the app name, icon, and colors for your school:

1.  **App Name**: Open `mobile/app.json` and change the `"name"` and `"slug"`.
2.  **Package Name**: Update `"android.package"` (e.g., `com.yourschool.nucleiq`).
3.  **Icons**:
    *   Replace `mobile/assets/icon.png` (1024x1024).
    *   Replace `mobile/assets/splash.png` (2048x2048).
    *   Replace `mobile/assets/adaptive-icon.png` (1024x1024).

## 3. Setup Build Environment (Windows)

To build the app locally, you need the following installed:

1.  **Java Development Kit (JDK)**: Version 17 is recommended.
2.  **Android Studio**: Install it and use the SDK Manager to install:
    *   Android SDK Platform (Target version)
    *   Android SDK Build-Tools
    *   Android Emulator
3.  **Environment Variables**:
    *   Set `ANDROID_HOME` to your SDK location (usually `C:\Users\YourUser\AppData\Local\Android\Sdk`).
    *   Add `%ANDROID_HOME%\platform-tools` to your `Path`.

## 4. Building the Android App

### Method A: Local Build (Recommended for offline)
This generates an APK directly on your machine.

1.  Navigate to the `mobile` directory.
2.  Perform a native prebuild (already done during setup, but run if you change app.json):
    ```powershell
    npx expo prebuild --platform android
    ```
3.  Build the debug APK:
    ```powershell
    cd android
    ./gradlew assembleDebug
    ```
4.  The APK will be located at: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

### Method B: EAS Build (Cloud)
Recommended for production or if you don't want to install Android Studio.

1.  Install EAS CLI:
    ```powershell
    npm install -g eas-cli
    ```
2.  Login to Expo:
    ```powershell
    eas login
    ```
3.  Build:
    ```powershell
    eas build -p android --profile preview
    ```

## 5. Configuration for "This School App"

If you are deploying this for a specific tenant (school):
1.  Users will log in with their credentials.
2.  The app handles tenant-switching automatically based on the user's account.
3.  Ensure the backend `CORS_ALLOWED_ORIGINS` in `backend/.env` allows connections if you are using the web version alongside mobile.
