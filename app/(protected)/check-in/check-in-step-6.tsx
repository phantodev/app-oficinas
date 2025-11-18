import { RelativePathString, useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function CheckIn6Page() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-stone-800">
      <Text className="text-2xl font-bold text-white">Check-In - Passo 2</Text>
      <Button
        title="Próximo"
        onPress={() =>
          router.push("/check-in/check-in-step-7" as RelativePathString)
        }
      />
    </View>
  );
}
