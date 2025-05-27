import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isFirstLaunch = useFirstLaunch();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded || isFirstLaunch === null) {
    // Wait for font loading and first launch check
    return null;
  }

  if (isFirstLaunch) {
    return <Redirect href="/intro" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
