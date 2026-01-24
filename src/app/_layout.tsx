import Aptabase from "@aptabase/react-native";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';


import { LocaleProvider } from "@/hooks/useLocale";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import '../global.css';

Aptabase.init("CODE_HERE", {
  host: "https://aptabase.kutay.boo",
});

//add sentry
//https://docs.sentry.io/platforms/react-native/manual-setup/expo/

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{}}>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
