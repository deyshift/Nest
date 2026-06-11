import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { saveTokens } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';

const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
};

export default function AuthScreen() {
  const { setAuthenticated, setAthlete } = useAuthStore();

  const redirectUri = makeRedirectUri({ scheme: 'velogarage', path: 'auth' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      scopes: ['activity:read_all'],
      redirectUri,
      responseType: 'code',
      extraParams: { approval_prompt: 'auto' },
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { code } = response.params;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/strava`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!resp.ok) throw new Error('Token exchange failed');
        const data = await resp.json();

        await saveTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          athlete_id: data.athlete?.id ?? 0,
        });

        if (data.athlete) {
          setAthlete(data.athlete.id, data.athlete.firstname, data.athlete.profile_medium);
        }
        setAuthenticated(true);
        router.replace('/(tabs)/bikes');
      } catch (e) {
        console.error('Auth error', e);
      }
    })();
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>🚲</Text>
        <Text style={styles.title}>VeloGarage</Text>
        <Text style={styles.subtitle}>Track your bikes. Know when to wrench.</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !request && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        {!request ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect with Strava</Text>
        )}
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
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  fine: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18 },
});
