import Feather from "@expo/vector-icons/Feather";
import { useVideoPlayer, VideoView } from "expo-video";
import { TouchableOpacity, View } from "react-native";

interface VideoPreviewProps {
  uri: string;
  width: number;
  height: number;
  onPress?: () => void;
}

export function VideoPreview({
  uri,
  width,
  height,
  onPress,
}: VideoPreviewProps) {
  const player = useVideoPlayer(uri, (player) => {
    player.pause();
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width, height }}
      className="bg-gray-700"
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      <View className="absolute inset-0 justify-center items-center bg-black/30">
        <View className="bg-black/50 rounded-full p-3">
          <Feather name="play" size={24} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
