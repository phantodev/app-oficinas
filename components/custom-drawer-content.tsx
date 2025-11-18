import { authService } from "@/services/auth.service";
import Feather from "@expo/vector-icons/Feather";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
  useDrawerStatus,
} from "@react-navigation/drawer";
import type { User } from "@supabase/supabase-js";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const drawerStatus = useDrawerStatus();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUser = async () => {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: result.error || "Erro ao carregar usuário",
        });
        router.replace("/(auth)/login");
      }
      setIsLoading(false);
    };

    // Carregar dados do usuário quando o drawer abrir
    if (drawerStatus === "open") {
      loadUser();
    }
  }, [drawerStatus]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await authService.signOut();
    Toast.show({
      type: "success",
      text1: "Logout",
      text2: "Você saiu do sistema com sucesso",
    });
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 4000);
    setIsLoggingOut(false);
  };

  // Obter nome completo do usuário (pode estar em user_metadata ou email)
  const getUserName = () => {
    if (user?.user_metadata?.nome) {
      return user.user_metadata.nome;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Usuário";
  };

  // Obter iniciais para o avatar
  const getInitials = () => {
    const name = getUserName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Obter URL do avatar (se houver)
  const getAvatarUrl = () => {
    return (
      user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
    );
  };

  return (
    <View
      className="flex-1 bg-[#1a1a1a]"
      style={{ paddingBottom: insets.bottom }}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerClassName="flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Footer com informações do usuário */}
      <View
        className="border-t border-[#333333] bg-[#1a1a1a] pt-4 px-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center mb-4">
          {/* Avatar */}
          <View className="mr-3">
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : getAvatarUrl() ? (
              <Image
                source={{ uri: getAvatarUrl() }}
                className="w-[50px] h-[50px] rounded-full bg-[#333333]"
              />
            ) : (
              <View className="w-[50px] h-[50px] rounded-full bg-[#4a9eff] justify-center items-center">
                <Text className="text-white text-lg font-semibold">
                  {getInitials()}
                </Text>
              </View>
            )}
          </View>

          {/* Informações do usuário */}
          <View className="flex-1 justify-center">
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text
                  className="text-white text-base font-semibold mb-1"
                  numberOfLines={1}
                >
                  {getUserName()}
                </Text>
                {user?.email && (
                  <Text className="text-[#999999] text-sm" numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Botão de Sair */}
        <TouchableOpacity
          className={`bg-[#ff3b30] py-3 px-4 rounded-lg items-center justify-center min-h-[44px] ${
            isLoggingOut ? "opacity-60" : ""
          }`}
          onPress={handleSignOut}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Feather name="log-out" size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold">
                Sair do Sistema
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
