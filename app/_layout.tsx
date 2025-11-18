import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import "../global.css";
import { ReactQueryProvider } from "../providers/ReactQueryProvider";

// Configurar o logger do Reanimated para reduzir warnings durante desenvolvimento
// Isso resolve o warning sobre ler `value` durante o render
if (__DEV__) {
  configureReanimatedLogger({
    strict: false, // Desabilita o strict mode que causa warnings
    level: ReanimatedLogLevel.warn,
  });
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkSession();

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Cleanup do listener
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000000",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReactQueryProvider>
        <HeroUINativeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#000000" },
            }}
          >
            {isAuthenticated ? (
              <Stack.Screen name="(protected)" />
            ) : (
              <Stack.Screen name="(auth)" />
            )}
          </Stack>
        </HeroUINativeProvider>
      </ReactQueryProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
