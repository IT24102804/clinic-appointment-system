import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="appointments/new" options={{ headerShown: false }} />
        <Stack.Screen name="appointments/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="appointments/[id]/edit" options={{ headerShown: false }} />
        <Stack.Screen name="doctors/index" options={{ headerShown: false }} />
        <Stack.Screen name="doctors/new" options={{ headerShown: false }} />
        <Stack.Screen name="doctors/[id]/index" options={{ headerShown: false }} />
        <Stack.Screen name="doctors/[id]/edit" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
