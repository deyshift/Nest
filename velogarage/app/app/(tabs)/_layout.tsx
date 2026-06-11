import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 22 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FC4C02',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222' },
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="bikes"
        options={{
          title: 'Garage',
          tabBarIcon: ({ focused }) => <Icon label={focused ? '🏠' : '🏠'} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => <Icon label="🔧" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <Icon label="⚙️" />,
        }}
      />
    </Tabs>
  );
}
