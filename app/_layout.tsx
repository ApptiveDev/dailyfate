import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/styles/global.css';
import { AuthProvider } from '@/providers/AuthProvider';
import {
  useFonts,
  NotoSerifKR_400Regular,
  NotoSerifKR_600SemiBold,
  NotoSerifKR_700Bold,
  NotoSerifKR_800ExtraBold,
} from '@expo-google-fonts/noto-serif-kr';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSerifKR_400Regular,
    NotoSerifKR_600SemiBold,
    NotoSerifKR_700Bold,
    NotoSerifKR_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <GestureHandlerRootView style={{ flex: 1 }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerBackVisible: false }}>
            <Stack.Screen
              name="index"
              options={{
                headerTitle: '',
                headerShown: true,
              }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
