import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Modal, TouchableOpacity, View } from "react-native";

interface ImageModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export function ImageModal({ visible, imageUri, onClose }: ImageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <TouchableOpacity
          className="absolute top-12 right-5 z-10 w-11 h-11 rounded-full bg-black/50 justify-center items-center"
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
        />
      </View>
    </Modal>
  );
}
