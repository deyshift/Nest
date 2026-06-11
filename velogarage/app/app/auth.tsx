import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { saveTokens } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';

// Strava sends the user here after authorising — our FastAPI backend.
// The backend exchanges the code and redirects to velogarage://auth?access_token=...
const CALLBACK_URL = `${API_BASE}/api/auth/callback`;

const STRAVA_AUTH_URL =
  `https://www.strava.com/oauth/mobile/authorize` +
  `?client_id=${STRAVA_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
  `&response_type=code` +
  `&approval_prompt=auto` +
  `&scope=activity%3Aread_all`;

export default function AuthScreen() {
  const { setAuthenticated, setAthlete } = useAuthStore();

  // Handle the deep link that the backend redirects back to after token exchange:
  // velogarage://auth?access_token=...&refresh_token=...&expires_at=...
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle the case where the app was cold-started by the deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  async function handleDeepLink(url: string) {
    if (!url.startsWith('velogarage://auth')) return;

    const { queryParams } = Linking.parse(url);
    if (!queryParams) return;

    const { access_token, refresh_token, expires_at, athlete_id, athlete_name, athlete_photo, error } =
      queryParams as Record<string, string>;

    if (error) {
      console.error('Strava auth error:', error);
      return;
    }

    if (!access_token || !refresh_token || !expires_at) return;

    await saveTokens({
      access_token,
      refresh_token,
      expires_at: Number(expires_at),
      athlete_id: Number(athlete_id ?? 0),
    });

    if (athlete_name) {
      setAthlete(Number(athlete_id), athlete_name, athlete_photo);
    }

    setAuthenticated(true);
    router.replace('/(tabs)/bikes');
  }

  async function connectStrava() {
    await WebBrowser.openBrowserAsync(STRAVA_AUTH_URL);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>🚲</Text>
        <Text style={styles.title}>VeloGarage</Text>
        <Text style={styles.subtitle}>Track your bikes. Know when to wrench.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={connectStrava}>
        <Text style={styles.buttonText}>Connect with Strava</Text>
      </TouchableOpacity>

      <Text style={styles.fine}>
        VeloGarage reads your ride data to calculate component wear. We never post or modify your
        Strava activities.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 32,
  },
  logo: { alignItems: 'center', gap: 8 },
  logoText: { fontSize: 64 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center' },
  button: {
    backgroundColor: '#FC4C02',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  fine: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18 },
});
