import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import '../src/i18n/i18n';
import { ThemeProvider } from "../src/theme/ThemeContext";
import { setupDatabase } from "../src/db/dbInit"; // ← новый импорт

// Инициализируем БД один раз при старте приложения.
// setupDatabase() синхронный — выполнится до первого рендера.
setupDatabase();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{
          headerShown: false,
        }}/>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
