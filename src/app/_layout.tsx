import Aptabase from "@aptabase/react-native";
import { ConvexProvider } from 'convex/react';
import { Stack, useRouter, useSegments } from 'expo-router';
import 'react-native-reanimated';

import { getConvexReactClient } from '@/convex/client';
import { LocaleProvider } from "@/hooks/useLocale";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from "@rn-primitives/portal";
import * as QuickActions from "expo-quick-actions";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { SafeAreaProvider } from "react-native-safe-area-context";

import '../global.css';

import * as Sentry from '@sentry/react-native';

Aptabase.init("CODE_HERE", {
  host: "https://aptabase.kutay.boo",
});

const truncateBreadcrumbValue = (value: unknown, maxLength = 500): unknown => {
  if (typeof value === 'string') {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => truncateBreadcrumbValue(item, maxLength));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.reduce<Record<string, unknown>>((acc, [key, entryValue]) => {
      acc[key] = truncateBreadcrumbValue(entryValue, maxLength);
      return acc;
    }, {});
  }

  return value;
};

const convex = getConvexReactClient();

SplashScreen.preventAutoHideAsync();

function AppWrapper() {
  const router = useRouter();
  const segments = useSegments();

  // Analytics tracking
  useEffect(() => {
    // Track app opened event
    Aptabase.trackEvent("app_opened");
  }, []);

  // Track session duration
  const sessionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - track session resumed
        sessionStartTimeRef.current = Date.now();
        Aptabase.trackEvent("session_resumed");
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - track session duration
        const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000); // in seconds
        Aptabase.trackEvent("session_ended", { duration_seconds: sessionDuration });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.WARN);

    if (Platform.OS === 'ios') {
      if (__DEV__) {
        Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY! });
      } else {
        Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY! });
      }
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY! });
    }
  }, []);

  const handleQuickAction = async (action: any) => {
    if (action?.id === 'contact-support') {
      const email = action?.params?.email || 'EMAIL HERE';
      const subject = encodeURIComponent('APP NAME HERE Support Request');
      const mailtoUrl = `mailto:${email}?subject=${subject}`;

      try {
        await Linking.openURL(mailtoUrl);
      } catch (error) {
        console.error('Error opening email:', error);
      }
    }
  };

  useQuickActionCallback((action) => {
    handleQuickAction(action);
  });

  useEffect(() => {
    if (typeof QuickActions.setItems !== 'function' || typeof QuickActions.addListener !== 'function') {
      return;
    }

    QuickActions.setItems([
      {
        title: 'Wait! Don\'t Delete!',
        subtitle: "We're here to help",
        icon: Platform.OS === 'ios' ? 'symbol:envelope' : undefined,
        id: 'contact-support',
        params: { email: 'EMAIL HERE' },
      },
    ]);

    const subscription = QuickActions.addListener((action) => {
      handleQuickAction(action);
    });

    const initialAction = QuickActions.initial;
    if (initialAction) {
      setTimeout(() => {
        handleQuickAction(initialAction);
      }, 1000);
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: '',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="+not-found" />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <KeyboardProvider>
              <ConvexProvider client={convex}>
                <StatusBar style="dark" />
                <AppWrapper />
                <PortalHost />
              </ConvexProvider>
            </KeyboardProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </LocaleProvider>
    </SafeAreaProvider>
  );
})
