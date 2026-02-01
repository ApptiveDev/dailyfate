import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/styles/global.css';
import { AuthProvider, MissionProvider, PhotoProvider } from '@/providers';
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    'WantedSans-Regular': require('../assets/fonts/WantedSans-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    'WantedSans-SemiBold': require('../assets/fonts/WantedSans-SemiBold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    'WantedSans-Bold': require('../assets/fonts/WantedSans-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <GestureHandlerRootView style={{ flex: 1 }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <MissionProvider>
            <PhotoProvider>
              <Stack screenOptions={{ headerBackVisible: false }}>
                <Stack.Screen
                  name="index"
                  options={{
                    headerTitle: '',
                    headerShown: true,
                  }}
                />
              </Stack>
            </PhotoProvider>
          </MissionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
