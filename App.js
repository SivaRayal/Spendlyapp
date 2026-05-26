import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { UiProvider } from './src/context/UiContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navTheme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UiProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </UiProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
