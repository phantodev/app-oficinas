import Feather from "@expo/vector-icons/Feather";
import {
  CameraMode,
  CameraRatio,
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken?: (uri: string) => void;
  onVideoRecorded?: (uri: string) => void;
}

export function CameraModal({
  visible,
  onClose,
  onPhotoTaken,
  onVideoRecorded,
}: CameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStarted, setRecordingStarted] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  // CameraRatio aceita valores como "4:3", "16:9", etc.
  // Para 9:16 (portrait), podemos usar undefined ou tentar outro valor
  const [pictureRatio, setPictureRatio] = useState<CameraRatio | undefined>(
    undefined
  );
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<
    { uri: string } | undefined
  > | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Limpa os refs quando o modal fecha
  useEffect(() => {
    if (!visible) {
      recordingPromiseRef.current = null;
      recordingStartTimeRef.current = null;
      setIsRecording(false);
      setRecordingStarted(false);
      setCameraMode("picture");
    }
  }, [visible]);

  const handleRequestPermission = useCallback(async () => {
    try {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permissão Negada",
          "É necessário permitir o acesso à câmera para tirar fotos.",
          [
            {
              text: "OK",
              onPress: onClose,
            },
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão da câmera:", error);
      Alert.alert("Erro", "Não foi possível solicitar permissão da câmera.", [
        {
          text: "OK",
          onPress: onClose,
        },
      ]);
    }
  }, [requestPermission, onClose]);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo && onPhotoTaken) {
        onPhotoTaken(photo.uri);
        onClose();
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao tirar foto",
        text2: "Não foi possível tirar a foto.",
      });
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    // Verificar e solicitar permissão de microfone antes de gravar
    if (!microphonePermission?.granted) {
      const { granted } = await requestMicrophonePermission();
      if (!granted) {
        Toast.show({
          type: "error",
          text1: "Permissão de Microfone Negada",
          text2:
            "É necessário permitir o acesso ao microfone para gravar vídeos com áudio.",
        });
        return;
      }
    }

    try {
      // Muda o modo da câmera para "video" antes de iniciar a gravação
      setCameraMode("video");

      // Aguarda um pequeno delay para o modo mudar
      await new Promise((resolve) => setTimeout(resolve, 200));

      setIsRecording(true);
      setRecordingStarted(true);
      const startTime = Date.now();
      recordingStartTimeRef.current = startTime;
      console.log("Start recording - timestamp setado:", startTime);

      // Inicia a gravação e armazena a Promise
      // Adiciona opções para garantir que a gravação funcione corretamente
      recordingPromiseRef.current = cameraRef.current.recordAsync({
        maxDuration: 60,
      });
      console.log("Start recording - Promise criada");

      // Aguarda um delay maior para garantir que a gravação realmente iniciou no nível nativo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Start recording - delay concluído, gravação iniciada");
    } catch (error: any) {
      console.error("Erro ao iniciar gravação:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao iniciar gravação",
        text2: "Não foi possível iniciar a gravação do vídeo.",
      });
      setIsRecording(false);
      setRecordingStarted(false);
      recordingStartTimeRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    // Debug: verifica o estado do recordingStartTimeRef
    const recordingDuration = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 0;

    console.log(
      "Stop recording - recordingStartTimeRef:",
      recordingStartTimeRef.current
    );
    console.log("Stop recording - isRecording:", isRecording);
    console.log("Stop recording - duração (ms):", recordingDuration);

    // Verifica se a gravação teve tempo suficiente (pelo menos 1 segundo)
    if (recordingDuration < 1000) {
      Toast.show({
        type: "error",
        text1: "Gravação muito curta",
        text2: `Aguarde pelo menos 1 segundo. Duração atual: ${Math.round(
          recordingDuration / 1000
        )}s`,
      });
      return;
    }

    try {
      // Adiciona um pequeno delay antes de parar para garantir que tudo está sincronizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Para a gravação
      cameraRef.current.stopRecording();

      // Aguarda a Promise do recordAsync ser resolvida
      if (recordingPromiseRef.current) {
        try {
          const video = await recordingPromiseRef.current;

          if (video && video.uri && onVideoRecorded) {
            onVideoRecorded(video.uri);
            onClose();
          } else {
            Toast.show({
              type: "error",
              text1: "Vídeo não disponível",
              text2: "Não foi possível obter o vídeo gravado.",
            });
          }
        } catch (error: any) {
          console.error("Erro ao finalizar gravação:", error);

          // Ignora o erro específico de gravação muito curta
          if (error?.message?.includes("stopped before any data")) {
            Toast.show({
              type: "error",
              text1: "Gravação muito curta",
              text2: "Grave por pelo menos 1 segundo.",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Erro ao gravar vídeo",
              text2: error?.message || "Não foi possível gravar o vídeo.",
            });
          }
        } finally {
          recordingPromiseRef.current = null;
          recordingStartTimeRef.current = null;
          setIsRecording(false);
          setRecordingStarted(false);
          // Volta o modo para "picture" após parar a gravação
          setCameraMode("picture");
        }
      } else {
        setIsRecording(false);
        setRecordingStarted(false);
        recordingStartTimeRef.current = null;
        // Volta o modo para "picture" após parar a gravação
        setCameraMode("picture");
      }
    } catch (error: any) {
      console.error("Erro ao parar gravação:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao parar gravação",
        text2: "Não foi possível parar a gravação.",
      });
      setIsRecording(false);
      setRecordingStarted(false);
      recordingPromiseRef.current = null;
      recordingStartTimeRef.current = null;
      // Volta o modo para "picture" em caso de erro
      setCameraMode("picture");
    }
  };

  // Estado de carregamento enquanto verifica permissão
  if (permission === null) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Verificando permissões...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Permissão negada
  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionContainer}>
            <Feather name="camera-off" size={64} color="#FFFFFF" />
            <Text style={styles.permissionTitle}>
              Acesso à Câmera Necessário
            </Text>
            <Text style={styles.permissionText}>
              Para usar a câmera, é necessário permitir o acesso nas
              configurações do dispositivo.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermission}
            >
              <Text style={styles.permissionButtonText}>
                Solicitar Permissão
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permissionButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.permissionButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Câmera com permissão concedida
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraMode}
          mode={cameraMode}
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          ratio={pictureRatio}
        />

        {/* Header com botão de fechar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButtonHeader} onPress={onClose}>
            <Feather name="x" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Controles na parte inferior */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
          >
            <Feather name="refresh-cw" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && styles.recordingButton,
            ]}
            onPress={isRecording ? stopRecording : takePicture}
            disabled={isRecording && Platform.OS === "ios"}
          >
            {isRecording ? (
              <View style={styles.recordingIndicator} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Feather
              name={isRecording ? "square" : "video"}
              size={28}
              color={isRecording ? "#FF0000" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    backgroundColor: "#292524",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    margin: 24,
    gap: 16,
  },
  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
  permissionText: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  closeButton: {
    backgroundColor: "#6B7280",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  closeButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  recordingButton: {
    backgroundColor: "#FF0000",
    borderColor: "#FF0000",
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },
  recordingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});
