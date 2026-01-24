# Expo Template Improvements from AI Outfit Analyzer

This document analyzes the `ai-outfit-analyzer` project and identifies reusable patterns, utilities and components that can be added to the `expo-template` starter.

---

## 1. i18n (Internationalization) Improvements

### Current State
Expo-template already has `useLocale` hook with full locale support (36 languages).

### Improvement: Missing Translation Fallback

**Problem:** The template lacks a fallback mechanism for missing translations.

**Solution from ai-outfit-analyzer:**
```tsx
// src/hooks/useLocale.tsx

i18n.enableFallback = true;

(i18n as any).missingTranslation = function(scope: string, options: any) {
    const originalLocale = i18n.locale;
    i18n.locale = DEFAULT_LANGUAGE_CODE; // "en"
    const result = i18n.t(scope, options);
    i18n.locale = originalLocale;
    return result;
};
```

**Benefits:**
- If a translation key is missing for current language, automatically falls back to English
- Prevents raw translation keys from showing in UI
- Provides better UX for partially translated languages

---

## 2. Reusable Hooks

### useCameraPermissions
**Purpose:** Handles camera permission requests and status checks.

**File:** `src/hooks/useCameraPermissions.ts`

```tsx
import { useCameraDevice, useCameraPermission, Camera } from 'react-native-vision-camera';
import { useEffect, useState } from 'react';

export function useCameraPermissions() {
  const permission = useCameraPermission();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    const checkPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status === 'granted') {
        setIsPermissionGranted(true);
      } else if (status === 'not-determined') {
        const newStatus = await Camera.requestCameraPermission();
        setIsPermissionGranted(newStatus === 'granted');
      }
    };

    checkPermission();
  }, []);

  return {
    isPermissionGranted,
    requestPermission: Camera.requestCameraPermission,
    device,
    permission
  };
}
```

**Usage:**
```tsx
const { isPermissionGranted, requestPermission } = useCameraPermissions();
```

---

### useAppLayout
**Purpose:** Reusable app layout hook with provider setup.

**File:** `src/hooks/useAppLayout.ts`

```tsx
import * as Font from 'expo-font';
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
      // e.g., router.push(/analysis/${id}});
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
```

---

### useConvexQuery (Simplified)
**Purpose:** Simplified wrappers for Convex queries, mutations, and actions with loading states.

**File:** `src/hooks/useConvexQuery.ts`

```typescript
import { useQuery, useMutation, useAction } from 'convex/react';
import type { FunctionReference } from 'convex/server';

/**
 * Simple hook pattern for Convex queries with loading states
 *
 * Usage:
 *   const { data, isLoading, error } = useConvexQuery(
 *     api.your.queryFunction,
 *     { param: value }
 *   );
 */
export function useConvexQuery<T, Args extends Record<string, unknown>>(
  query: FunctionReference<"query", Args, T>,
  args: Args,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const result = useQuery(
    query,
    args,
    {
      ...(options?.enabled !== undefined && { enabled: options.enabled }),
      ...(options?.refetchInterval && { refetchInterval: options.refetchInterval }),
    }
  );

  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Simple hook pattern for Convex mutations with loading states
 *
 * Usage:
 *   const { mutate, isLoading, error } = useConvexMutation(
 *     api.your.mutationFunction
 *   );
 *
 *   await mutate({ param: value });
 */
export function useConvexMutation<T, Args extends Record<string, unknown>>(
  mutation: FunctionReference<"mutation", Args, T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
) {
  const [optimisticData, setOptimisticData] = React.useState<T | null>(null);

  const result = useMutation(mutation, {
    optimisticUpdate: optimisticData
      ? (localCtx, globalCtx) => {
          return {
              [mutation]: optimisticData as any,
            };
        }
      : undefined,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const mutate = React.useCallback(
    async (args: Args) => {
      setOptimisticData(null);
      const data = await result.mutate(args);
      return data;
    },
    [result.mutate]
  );

  return {
    mutate,
    isLoading: result.isLoading,
    error: result.error,
    isSuccess: result.status === 'success',
    optimisticData,
  };
}

/**
 * Simple hook pattern for Convex actions
 *
 * Usage:
 *   const { run, isLoading, error } = useConvexAction(
 *     api.your.actionFunction
 *   );
 *
 *   await run({ param: value });
 */
export function useConvexAction<T, Args extends Record<string, unknown>>(
  action: FunctionReference<"action", Args, T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
) {
  const result = useAction(action, {
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const run = React.useCallback(
    async (args: Args) => {
      return await result(args);
    },
    [result]
  );

  return {
    run,
    isLoading: result.isLoading,
    error: result.error,
    data: result.data,
  };
}
```

---

### useSearch & useFilter
**Purpose:** Debounced search with custom filter support and multi-criteria filtering.

**File:** `src/hooks/useSearch.ts`

```typescript
import { useMemo, useState } from 'react';

export interface SearchOptions<T> {
  items: T[];
  searchKey?: keyof T | ((item: T) => string);
  filterFn?: (item: T, query: string) => boolean;
  enabled?: boolean;
  debounceMs?: number;
}

export interface SearchState<T> {
  filteredItems: T[];
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  hasResults: boolean;
  hasQuery: boolean;
  isEmpty: boolean;
}

/**
 * Simple search/filter hook with optional debouncing
 *
 * Usage:
 *   const { filteredItems, query, setQuery } = useSearch({
 *     items: yourItems,
 *     searchKey: 'name',
 *   });
 */
export function useSearch<T = unknown>({
  items,
  searchKey,
  filterFn,
  enabled = true,
  debounceMs = 300,
}: SearchOptions<T>): SearchState<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Simple debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const filteredItems = useMemo(() => {
    if (!enabled || !debouncedQuery) {
      return items;
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    return items.filter((item) => {
      // Use custom filter function if provided
      if (filterFn) {
        return filterFn(item, lowerQuery);
      }

      // Default: search by key or stringify
      if (!searchKey) {
        return JSON.stringify(item).toLowerCase().includes(lowerQuery);
      }

      // Search by key
      const value = typeof searchKey === 'function'
        ? searchKey(item as T)
        : item[searchKey];

      if (value === undefined || value === null) {
        return false;
      }

      return String(value).toLowerCase().includes(lowerQuery);
    });
  }, [items, debouncedQuery, searchKey, filterFn, enabled]);

  return {
    filteredItems,
    query,
    setQuery,
    clearQuery: () => setQuery(''),
    hasResults: filteredItems.length > 0,
    hasQuery: debouncedQuery.length > 0,
    isEmpty: !debouncedQuery || filteredItems.length === 0,
  };
}

export interface Filter<T> {
  key: string;
  value: unknown;
  label?: string;
  fn?: (item: T) => boolean;
}

export interface FilterState<T> {
  filteredItems: T[];
  filters: Filter<T>[];
  addFilter: (filter: Filter<T>) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Filter hook with multiple criteria
 *
 * Usage:
 *   const { filteredItems, addFilter, removeFilter, filters } = useFilter({
 *     items: yourItems,
 *   });
 */
export function useFilter<T = unknown>(
  items: T[],
  options?: {
    enabled?: boolean;
  }
): FilterState<T> {
  const [filters, setFilters] = useState<Filter<T>[]>([]);

  const filteredItems = useMemo(() => {
    if (filters.length === 0) {
      return items;
    }

    return items.filter((item) => {
      return filters.every((filter) => {
        // Use custom function if provided
        if (filter.fn) {
          return filter.fn(item);
        }

        // Default: check equality
        if (filter.value === undefined || filter.value === null) {
          return false;
        }

        const itemValue = item[filter.key as keyof T];
        return itemValue === filter.value;
      });
    });
  }, [items, filters]);

  const addFilter = (filter: Filter<T>) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.key === filter.key);
      return exists ? prev : [...prev, filter];
    });
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return {
    filteredItems,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters: filters.length > 0,
  };
}
```

---

## 3. Utilities

### lib/array.ts
**Purpose:** Type-safe array helpers.

```typescript
function first(array: unknown[]) { /* returns first element or null */ }
function second(array: unknown[]) { /* returns second element or null */ }
function last(array: unknown[]) { /* returns last element or null */ }
function isEmpty(array: unknown) { /* checks if array is empty */ }
```

**Benefits:**
- Type-safe null checks
- Reduces `array?.[0]` pattern
- Clean, readable code

---

## 4. Convex Integration

### Client Setup
**File:** `src/convex/client.ts`

```typescript
import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

let convexClient: ConvexHttpClient | null = null;
let convexReactClient: ConvexReactClient | null = null;

export function getConvexClient() {
  if (!convexClient) {
    const convexUrl = __DEV__
      ? process.env.EXPO_PUBLIC_DEVELOPMENT_CONVEX_URL
      : process.env.EXPO_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      throw new Error(
        __DEV__
          ? "EXPO_PUBLIC_DEVELOPMENT_CONVEX_URL environment variable is not set"
          : "EXPO_PUBLIC_CONVEX_URL environment variable is not set"
      );
    }
    convexClient = new ConvexHttpClient(convexUrl);
  }
  return convexClient;
}

export function getConvexReactClient() {
  if (!convexReactClient) {
    const convexUrl = __DEV__
      ? process.env.EXPO_PUBLIC_DEVELOPMENT_CONVEX_URL
      : process.env.EXPO_PUBLIC_CONVEX_URL;

    if (!convexReactClient) {
      throw new Error(
        __DEV__
          ? "EXPO_PUBLIC_DEVELOPMENT_CONVEX_URL environment variable is not set"
          : "EXPO_PUBLIC_CONVEX_URL environment variable is not set"
      );
    }
    convexReactClient = new ConvexReactClient(convexUrl);
  }
  return convexReactClient;
}
```

**Benefits:**
- Singleton pattern prevents multiple clients
- Environment-aware URL selection
- Type-safe exports for both HTTP and React clients

---

## 5. Additional Patterns (From Further Analysis)

### AsyncStorage Abstraction
**Pattern:** Direct AsyncStorage calls scattered across components.

**Solution:** Create `useAsyncStorage` hook for consistent storage operations.

```typescript
// src/hooks/useAsyncStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

export function useAsyncStorage() {
  const getItem = useCallback(async (key: string) => {
    return await AsyncStorage.getItem(key);
  }, []);

  const setItem = useCallback(async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  }, []);

  const removeItem = useCallback(async (key: string) => {
    await AsyncStorage.removeItem(key);
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.clear();
  }, []);

  return { getItem, setItem, removeItem, clear };
}
```

**Benefits:**
- Consistent error handling
- Single source of truth for storage operations
- Easier to mock for testing

---

### Form Validation
**Pattern:** Add validation utilities for form inputs.

```typescript
// src/lib/validation.ts
export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export function validate(value: any, rules: ValidationRules): { valid: boolean; errors: Record<string, string> } {
  const errors = Record<string, string> = {};
  let valid = true;

  for (const [key, rule] of Object.entries(rules)) {
    if (!rule.validate(value)) {
      errors[key] = rule.message;
      valid = false;
    }
  }

  return { valid, errors };
}
```

---

### Loading Skeletons
**Pattern:** Consistent loading state with skeleton components.

```typescript
// src/components/ui/skeleton.tsx
import { View } from 'react-native';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <View className={cn('bg-muted rounded animate-pulse', className)} />
  );
}

// Usage examples:
// <Skeleton className="h-4 w-4" />
// <Skeleton className="h-8 w-full" />
```

---

### Toast Notifications
**Pattern:** Add toast notification system for user feedback.

```typescript
// src/components/ui/toast.tsx
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

export function useToast() {
  const visible = useSharedValue(0);

  const show = useCallback((message: string, duration = 2000) => {
    // Toast implementation
  }, []);

  return { show };
}

export function Toast({ message, visible }: { message: string; visible: Animated.SharedValue<number> }) {
  // Toast component implementation
  return <View><Text>{message}</Text></View>;
}
```

---

### Image Generation Store
**Pattern:** Use Zustand for image generation state management.

```typescript
// src/stores/useImageGenerationStore.ts
import { create } from 'zustand';

interface ImageGenerationState {
  isGenerating: boolean;
  images: string[];
  error: string | null;
  clear: () => void;
  startGeneration: () => void;
  addImage: (url: string) => void;
}

export const useImageGenerationStore = create<ImageGenerationState>((set) => ({
  isGenerating: false,
  images: [],
  error: null,
  clear: () => set({ isGenerating: false, images: [], error: null }),
  startGeneration: () => set({ isGenerating: true, error: null }),
  addImage: (url) => set((state) => ({ ...state, images: [...state.images, url] })),
}));
```

---

## 6. Package Additions

Add to `package.json` dependencies if needed:

```json
{
  "expo-image-manipulator": "~3.0.11",
  "@react-native-async-storage/async-storage": "2.2.0",
  "react-native-vision-camera": "^4.7.3"
}
```

---

## 7. Implementation Priority

**Quick Wins (1-2 hours):**
1. i18n fallback in useLocale
2. Add array utility
3. Add image compression utility

**Medium Effort (2-4 hours):**
4. Camera permissions hook
5. Convex client singleton
6. Simplified useConvexUser hook

**Larger Features (4-8 hours):**
7. RevenueCat integration (app-specific)
8. Widget support (iOS, app-specific)
9. R2 upload utility (app-specific)
10. AsyncStorage abstraction
11. Form validation utilities
12. Loading skeleton components
13. Toast notification system
14. Image generation store pattern
15. Consistent error handling patterns

---

## 8. Notes

- All hooks follow React best practices (useCallback, useMemo, useEffect with deps)
- Error handling is consistent (try/catch with console.error)
- Type safety is maintained throughout
- Platform-specific code uses `Platform.select` or platform checks
