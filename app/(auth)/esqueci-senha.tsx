import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function EsqueciSenhaScreen() {
  return (
    <View className="flex-1 items-center justify-center dark:bg-gray-900">
      <Text className="text-2xl font-bold dark:text-white">
        Esqueci minha senha
      </Text>
      <Link
        href="/(auth)/login"
        className="mt-4 text-blue-500 dark:text-blue-400"
      >
        Voltar para Login
      </Link>
    </View>
  );
}
