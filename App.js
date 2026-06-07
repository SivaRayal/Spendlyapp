import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { UiProvider } from './src/context/UiContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { makeNavTheme } from './src/theme';

function AppContent() {
  const { isDark, colors } = useTheme();
  const navTheme = makeNavTheme(colors, isDark);

  return (
    <NavigationContainer theme={navTheme}>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <UiProvider>
            <AppContent />
          </UiProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
