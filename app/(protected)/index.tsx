import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { WebView } from "react-native-webview";

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useNativeMap, setUseNativeMap] = useState(false); // false = WebView, true = Native

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

  const formatLocationText = () => {
    if (!location) return "";
    const { latitude, longitude } = location.coords;
    return `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(
      6
    )}`;
  };

  // Componente de PIN personalizado para mapa nativo
  const CustomPin = () => (
    <View style={styles.customPinContainer}>
      <View style={styles.customPin}>
        <View style={styles.pinInner} />
      </View>
      <View style={styles.pinShadow} />
    </View>
  );

  // HTML para Google Maps com marcador customizado (WebView)
  const getMapHTML = () => {
    if (!location) return "";
    const { latitude, longitude } = location.coords;
    const apiKey = "AIzaSyDZK4XhqbwkkNyCnYUG0JJ4LNEOpJGwxgo";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            #map {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initMap() {
              const position = { lat: ${latitude}, lng: ${longitude} };
              
              const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 15,
                center: position,
                mapTypeId: "roadmap",
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
              });

              // Criar ícone de marcador customizado usando SVG
              // PIN vermelho com círculo branco no centro
              const svgString = '<svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                  '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">' +
                    '<feGaussianBlur in="SourceAlpha" stdDeviation="2"/>' +
                    '<feOffset dx="0" dy="2" result="offsetblur"/>' +
                    '<feComponentTransfer>' +
                      '<feFuncA type="linear" slope="0.3"/>' +
                    '</feComponentTransfer>' +
                    '<feMerge>' +
                      '<feMergeNode/>' +
                      '<feMergeNode in="SourceGraphic"/>' +
                    '</feMerge>' +
                  '</filter>' +
                '</defs>' +
                '<path d="M20 0 C9 0 0 9 0 20 C0 28 20 50 20 50 C20 50 40 28 40 20 C40 9 31 0 20 0 Z" ' +
                      'fill="#FF0000" ' +
                      'stroke="#FFFFFF" ' +
                      'stroke-width="3" ' +
                      'filter="url(#shadow)"/>' +
                '<circle cx="20" cy="20" r="8" fill="#FFFFFF"/>' +
              '</svg>';
              
              const svgMarker = {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgString),
                scaledSize: new google.maps.Size(40, 50),
                anchor: new google.maps.Point(20, 50),
              };

              // Criar marcador customizado
              const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: "Sua Localização",
                icon: svgMarker,
                animation: google.maps.Animation.DROP,
              });

              // Info window opcional
              const infoWindow = new google.maps.InfoWindow({
                content: '<div style="padding: 10px;"><strong>Sua Localização</strong><br>Você está aqui</div>',
              });

              marker.addListener("click", () => {
                infoWindow.open(map, marker);
              });
            }
          </script>
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View className="flex-1">
      <View className="p-4 items-center">
        <Text className="text-2xl font-bold">Bem-vindo!</Text>
        <Text className="mt-4 text-gray-600">
          Esta é a tela principal após o login
        </Text>
        {errorMsg && <Text className="text-red-500 mt-2">{errorMsg}</Text>}
        {location && (
          <Text className="mt-4 text-gray-700 text-center">
            {formatLocationText()}
          </Text>
        )}
        {location && (
          <TouchableOpacity
            onPress={() => setUseNativeMap(!useNativeMap)}
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {useNativeMap ? "🌐 Usar WebView" : "📱 Usar Mapa Nativo"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {location && (
        <>
          {useNativeMap ? (
            // Mapa Nativo (react-native-maps)
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Sua Localização"
                description="Você está aqui"
                anchor={{ x: 0.5, y: 1 }}
              >
                <CustomPin />
              </Marker>
            </MapView>
          ) : (
            // Mapa WebView (Google Maps Web)
            <WebView
              style={styles.map}
              source={{ html: getMapHTML() }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
  },
  customPinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  customPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF0000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  pinShadow: {
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#000000",
    opacity: 0.2,
    marginTop: -5,
  },
});
