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

    if (!convexUrl) {
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
