/**
 * Simplified, reusable app layout pattern
 * Excludes app-specific providers (RevenueCat, device tokens, etc.)
 */

import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';

// Import providers if they exist in your project
// import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// import { PortalHost } from "@rn-primitives/portal";

// Import your client if using Convex
// import { ConvexProvider } from 'convex/react';
// import { getConvexReactClient } from '@/convex/client';
// import { ConvexUserProvider } from '@/hooks/useConvexUser';
// import { LocaleProvider } from "@/hooks/useLocale";

// const convex = getConvexReactClient();

SplashScreen.preventAutoHideAsync();

export function useAppLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [initialNavigationComplete, setInitialNavigationComplete] = useState(false);

  // Load fonts - customize for your project
  const [fonts] = Font.useFonts({
    // Add your custom fonts here
    // 'CustomFont': require('@/assets/fonts/CustomFont.ttf'),
  }) ?? {} as unknown as Record<string, Font.FontSource>;

  useEffect(() => {
    if (fontsLoaded && initialNavigationComplete) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialNavigationComplete]);

  useEffect(() => {
    // Set initial navigation complete when fonts are loaded
    if (fontsLoaded) {
      setInitialNavigationComplete(true);
    }
  }, [fontsLoaded]);

  // Handle deep links - customize for your project
  useEffect(() => {
    const handleUrl = (url: string) => {
      // Parse URL and navigate accordingly
      // e.g., router.push(`/analysis/${id}`);
    };

    Linking.addEventListener('url', handleUrl);

    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);

  return {
    fontsLoaded,
    fonts,
  };
}

/**
 * Root layout component
 * Wrap your Stack with necessary providers
 */
export default function RootLayout() {
  const { fontsLoaded } = useAppLayout();

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          {/* Add your app providers here */}
          {/* <LocaleProvider> */}
          {/* <ConvexProvider client={convex}> */}
          {/* <ConvexUserProvider> */}
          {/* <BottomSheetModalProvider> */}
            {/* <PortalHost /> */}
          <StatusBar style="auto" />
          {/* Add your Stack and screens here */}
        {/* </ConvexUserProvider> */}
          {/* </ConvexProvider> */}
          {/* </LocaleProvider> */}
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/**
 * Example usage in _layout.tsx:
 *
 * export default function Layout() {
 *   return (
 *     <RootLayout>
 *       <Stack
 *         screenOptions={{
 *           headerShown: false,
 *           contentStyle: { backgroundColor: 'transparent' },
 *         }}
 *       >
 *         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
 *         <Stack.Screen name="+not-found" />
 *       </Stack>
 *     </RootLayout>
 *   );
 * }
 */
