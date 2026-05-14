import "../global.css";
import { useEffect, useLayoutEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { storage } from "../lib/storage";
import { useAuthStore } from "../store/auth.store";

export const THEME_STORAGE_KEY = "color_scheme";

const queryClient = new QueryClient();

/** Restores the user's saved dark/light preference on every cold start.
 *  Uses useLayoutEffect + synchronous localStorage on web so the theme
 *  is applied before the browser paints — no white flash. */
function ThemeBootstrap() {
  const { setColorScheme } = useColorScheme();

  useLayoutEffect(() => {
    if (Platform.OS === "web") {
      // localStorage is synchronous — runs before the first paint
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
          setColorScheme(saved);
        }
      } catch {}
    } else {
      // Native: SecureStore is always async, flash is not visible in native apps
      storage.getItem(THEME_STORAGE_KEY).then((saved) => {
        if (saved === "dark" || saved === "light") {
          setColorScheme(saved);
        }
      });
    }
  }, []);

  return null;
}

function AuthGuard() {
  const { isAuthenticated, isLoading, setToken, clearToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Bootstrap: read token from secure storage once on mount
  useEffect(() => {
    storage.getItem("access_token").then((token) => {
      if (token) setToken(token);
      else {
        // No access token — also clear any stale refresh token
        storage.deleteItem("refresh_token");
        clearToken();
      }
    });
  }, []);

  // Redirect whenever auth state changes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    // Allow unauthenticated users to stay on the join screen so they
    // can see the household name and choose to register or sign in.
    const inJoinFlow = segments[0] === "join";

    if (!isAuthenticated && !inAuthGroup && !inJoinFlow) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(home)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function RootLayout() {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(home)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="month" />
      <Stack.Screen name="join" />
    </Stack>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrap />
      <AuthGuard />
      <RootLayout />
    </QueryClientProvider>
  );
}
