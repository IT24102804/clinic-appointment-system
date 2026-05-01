import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="doctors/index" options={{ title: "Doctors" }} />
        <Stack.Screen name="doctors/new" options={{ title: "Add Doctor" }} />
        <Stack.Screen name="doctors/[id]/index" options={{ title: "Doctor Details" }} />
        <Stack.Screen name="doctors/[id]/edit" options={{ title: "Edit Doctor" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}