import '../global.css';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in — send to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Logged in — send to tabs
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Sync class-based dark mode with the system color scheme preference
    const apply = (scheme: string | null | undefined) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', scheme === 'dark');
      }
    };

    apply(Appearance.getColorScheme());
    const sub = Appearance.addChangeListener(({ colorScheme }) => apply(colorScheme));
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
