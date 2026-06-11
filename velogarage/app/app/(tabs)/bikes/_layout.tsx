import { Stack } from 'expo-router';

export default function BikesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Garage' }} />
      <Stack.Screen name="[id]" options={{ title: 'Bike' }} />
      <Stack.Screen name="components/new" options={{ title: 'Add Component', presentation: 'modal' }} />
      <Stack.Screen name="components/[componentId]" options={{ title: 'Component' }} />
      <Stack.Screen name="log/new" options={{ title: 'Log Service', presentation: 'modal' }} />
    </Stack>
  );
}
