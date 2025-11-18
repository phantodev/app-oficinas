import Feather from "@expo/vector-icons/Feather";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Modal, TouchableOpacity, View } from "react-native";

interface VideoModalProps {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
}

export function VideoModal({ visible, videoUri, onClose }: VideoModalProps) {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    if (visible) {
      player.play();
    } else {
      player.pause();
    }
  }, [visible, player]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90 justify-center items-center">
        <TouchableOpacity
          className="absolute top-12 right-5 z-10 w-11 h-11 rounded-full bg-black/50 justify-center items-center"
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls={true}
          allowsFullscreen={true}
          allowsPictureInPicture={true}
        />
      </View>
    </Modal>
  );
}
