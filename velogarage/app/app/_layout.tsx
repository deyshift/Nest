import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { initDb } from '@/db/client';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { authenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    (async () => {
      await initDb();
      await checkAuth();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace('/auth');
    }
  }, [ready, authenticated]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
        <ActivityIndicator color="#FC4C02" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
