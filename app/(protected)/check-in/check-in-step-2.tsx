import { CameraModal } from "@/components/camera-modal";
import { ImageModal } from "@/components/image-modal";
import { VideoModal } from "@/components/video-modal";
import { VideoPreview } from "@/components/video-preview";
import { MediaItem, useMainStore } from "@/store/useMain.store";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { RelativePathString, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function CheckIn2Page() {
  const router = useRouter();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [expandedMediaUri, setExpandedMediaUri] = useState<string | null>(null);
  const [expandedMediaType, setExpandedMediaType] = useState<
    "image" | "video" | null
  >(null);

  const { vehicleData, setCheckInMediaList } = useMainStore();

  // Calcula a largura de cada item: (largura do container - gaps) / 3
  // gap-4 = 16px, com 3 itens temos 2 gaps = 32px
  const itemWidth = containerWidth > 0 ? (containerWidth - 32) / 3 : 0;

  useEffect(() => {
    console.log(vehicleData);
  }, []);

  const handlePhotoTaken = (uri: string) => {
    setMediaList((prev) => [...prev, { uri, type: "image" }]);
    console.log("Foto capturada:", uri);
  };

  const handleVideoRecorded = (uri: string) => {
    setMediaList((prev) => [...prev, { uri, type: "video" }]);
    console.log("Vídeo gravado:", uri);
  };

  const handleDeleteMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExpandMedia = (item: MediaItem) => {
    setExpandedMediaUri(item.uri);
    setExpandedMediaType(item.type);
  };

  return (
    <View className="flex-1 items-center justify-center bg-stone-800 px-6">
      {mediaList.length === 0 ? (
        <>
          <Image
            source={require("@/assets/images/camera-icon.png")}
            style={{ width: 220, height: 220 }}
            contentFit="contain"
          />
          <Text className="text-2xl font-bold text-white mt-2 mb-4">
            Upload de media
          </Text>
          <Text className="text-base text-white text-center">
            Analise o automóvel inteiro e verifique se existe alguma avaria
            externamente e internamente. Tire fotos ou grave videos.
          </Text>
        </>
      ) : (
        <View
          className="flex-row flex-wrap gap-4 w-full"
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setContainerWidth(width);
          }}
        >
          {mediaList.map((item, index) => (
            <View
              key={index}
              className="relative rounded-lg overflow-hidden"
              style={{
                width: itemWidth > 0 ? itemWidth : undefined,
                height: itemWidth > 0 ? itemWidth : undefined,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.uri }}
                  className="bg-gray-700"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentFit="cover"
                />
              ) : (
                <VideoPreview
                  uri={item.uri}
                  width={itemWidth > 0 ? itemWidth : 100}
                  height={itemWidth > 0 ? itemWidth : 100}
                  onPress={() => handleExpandMedia(item)}
                />
              )}

              {/* Botões de ação */}
              <View className="absolute top-1 right-1 flex-row gap-1">
                {item.type === "image" && (
                  <TouchableOpacity
                    onPress={() => handleExpandMedia(item)}
                    className="bg-black/50 rounded-full p-1.5"
                    activeOpacity={0.7}
                  >
                    <Feather name="maximize-2" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleDeleteMedia(index)}
                  className="bg-red-500/80 rounded-full p-1.5"
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      <Button
        className="w-full mt-4"
        onPress={() => setIsCameraModalVisible(true)}
      >
        Adicionar mídia
      </Button>
      <Button
        className="w-full mt-4"
        isDisabled={mediaList.length === 0}
        onPress={() => {
          setCheckInMediaList(mediaList);
          console.log("Mídias salvas no store:", mediaList);
          router.push("/check-in/check-in-step-3" as RelativePathString);
        }}
      >
        Próximo
      </Button>

      <CameraModal
        visible={isCameraModalVisible}
        onClose={() => setIsCameraModalVisible(false)}
        onPhotoTaken={handlePhotoTaken}
        onVideoRecorded={handleVideoRecorded}
      />

      <ImageModal
        visible={expandedMediaType === "image" && expandedMediaUri !== null}
        imageUri={expandedMediaUri || ""}
        onClose={() => {
          setExpandedMediaUri(null);
          setExpandedMediaType(null);
        }}
      />

      <VideoModal
        visible={expandedMediaType === "video" && expandedMediaUri !== null}
        videoUri={expandedMediaUri || ""}
        onClose={() => {
          setExpandedMediaUri(null);
          setExpandedMediaType(null);
        }}
      />
    </View>
  );
}
