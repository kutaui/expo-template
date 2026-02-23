import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationEventMap,
  NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { Tabs as ExpoTabs, withLayoutContext } from 'expo-router';
import { History as HistoryIcon, Home, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

// Check iOS version
const getIOSVersion = () => {
  if (Platform.OS !== 'ios') return 999;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseInt(version.split('.')[0], 10);
  }
  return version;
};

const iosVersion = getIOSVersion();
const useNativeTabs = Platform.OS === 'ios' && iosVersion >= 16;

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;

const NativeTabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(BottomTabNavigator);

export default function TabLayout() {

  // Use Expo's default tabs for iOS < 16
  if (!useNativeTabs) {
    return (
      <ExpoTabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E07A5F',
          tabBarInactiveTintColor: '#5C5C5C',
          tabBarStyle: { backgroundColor: '#FFF9F0', borderTopColor: '#E5E5E5' },
        }}
      >
        <ExpoTabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <View pointerEvents="none">
                <Home size={size} color={color} />
              </View>
            ),
          }}
        />
      </ExpoTabs>
    );
  }

  // Use native bottom tabs for iOS 16+ and Android
  return (
    <NativeTabs
      screenOptions={{
        tabBarActiveTintColor: '#E07A5F',
      }}
    >
      <NativeTabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => ({ sfSymbol: "house" }),
        }}
      />
    </NativeTabs>
  );
}
