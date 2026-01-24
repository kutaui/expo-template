# Expo Starter Template

A production-ready Expo template that you can use to quickly bootstrap new projects.

## Usage

```bash
npx create-expo-app my-app --template github:kutaui/expo-template
```

## How It Works

When you create a project from this template, create-expo-app will:

1. Clone this repository
2. Replace "expo-starter-app" with your project name in `app.json`
3. Replace "expo-starter-template" with your project name in `package.json`
4. Replace "com.yourcompany.expo-starter-app" with a default bundle identifier
5. Set up your project structure

## Features

- ⚡ **Expo Router** - File-based routing
- 🎨 **TailwindCSS 4** - Utility-first styling
- 🗄️ **Convex** - Backend as a service
- 🗃️ **Zustand** - State management
- 📱 **Multi-platform** - iOS, Android, Web
- 🎬 **Lottie** - Animations
- 📸 **Camera** - Image capture
- 🔔 **Notifications** - Push notifications
- 🌍 **i18n** - Internationalization

## After Creating Your Project

1. Run `npm run reset-project` to get a fresh app structure
2. Install dependencies: `npm install`
3. Start development: `npx expo start`

The reset-project script moves the starter code to `src/app-example` and creates a minimal `src/app` directory for you to start building.
