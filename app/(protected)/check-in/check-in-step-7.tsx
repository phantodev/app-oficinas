import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function CheckIn7Page() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-stone-800">
      <Text className="text-2xl font-bold text-white">Check-In - Passo 7</Text>
    </View>
  );
}
