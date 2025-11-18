import { Text, View } from "react-native";

import * as Location from "expo-location";
import { useEffect, useState } from "react";

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Usa GPS
      });
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold">Bem-vindo!</Text>
      <Text className="mt-4 text-gray-600">
        Esta é a tela principal após o login
      </Text>
      {errorMsg && <Text>{errorMsg}</Text>}
      {location && <Text>{JSON.stringify(location)}</Text>}
    </View>
  );
}
