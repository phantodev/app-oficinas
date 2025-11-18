import { useMainStore } from "@/store/useMain.store";
import Feather from "@expo/vector-icons/Feather";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import Constants from "expo-constants";
import { RelativePathString, useRouter } from "expo-router";
import { Button, TextField } from "heroui-native";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const FUEL_LEVELS = [
  { label: "0", value: 0 },
  { label: "1/4", value: 1 },
  { label: "1/2", value: 2 },
  { label: "3/4", value: 3 },
  { label: "Full", value: 4 },
];

export default function CheckIn3Page() {
  const router = useRouter();
  const { setCheckInStep3Data } = useMainStore();
  const [objetosPessoais, setObjetosPessoais] = useState("");
  const [nivelCombustivel, setNivelCombustivel] = useState(2); // Inicia em 1/2
  const [sliderWidth, setSliderWidth] = useState(0);
  const translateX = useSharedValue(0);
  const sliderWidthShared = useSharedValue(0);
  const startX = useSharedValue(0); // Posição inicial do gesto
  const [recording, setRecording] = useState(false);
  const [showMicrophoneModal, setShowMicrophoneModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] =
    useState<boolean>(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioPlayer = useAudioPlayer(recordedAudioUri || undefined);

  // Animação de pulsação da bolinha vermelha
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  const requestMicrophonePermission = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setMicrophonePermissionGranted(status.granted);

      if (status.granted) {
        // Configura o modo de áudio quando a permissão é concedida
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        return { granted: true };
      } else {
        Alert.alert(
          "Permissão Negada",
          "É necessário permitir o acesso ao microfone para usar a gravação de voz."
        );
        return { granted: false };
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão do microfone:", error);
      Alert.alert("Erro", "Não foi possível solicitar permissão do microfone.");
      return { granted: false };
    }
  };

  // Inicia a animação de pulsação
  const startPulseAnimation = () => {
    pulseScale.value = withRepeat(
      withTiming(1.3, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.5, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  };

  // Para a animação de pulsação
  const stopPulseAnimation = () => {
    pulseScale.value = withTiming(1, { duration: 200 });
    pulseOpacity.value = withTiming(1, { duration: 200 });
  };

  // Estilo animado da bolinha pulsante
  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  async function startRecording() {
    try {
      setRecording(true);
      setRecordedAudioUri(null);
      startPulseAnimation();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      setRecording(false);
      stopPulseAnimation();
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  }

  async function stopRecording() {
    try {
      setRecording(false);
      stopPulseAnimation();
      await audioRecorder.stop();
      // Obtém a URI do áudio gravado
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (error) {
      console.error("Erro ao parar gravação:", error);
      Alert.alert("Erro", "Não foi possível parar a gravação.");
    }
  }

  // Monitora o estado do recorder
  useEffect(() => {
    if (recorderState?.isRecording && !recording) {
      setRecording(true);
      startPulseAnimation();
    } else if (!recorderState?.isRecording && recording) {
      setRecording(false);
      stopPulseAnimation();
    }
  }, [recorderState?.isRecording]);

  // Limpa o player quando a modal fecha
  useEffect(() => {
    if (!showRecordingModal && audioPlayer) {
      audioPlayer.pause();
    }
  }, [showRecordingModal, audioPlayer]);

  // Função para transcrever áudio usando OpenAI
  const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
      const apiKey =
        Constants.expoConfig?.extra?.openaiApiKey ||
        process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("API Key da OpenAI não configurada");
      }

      // Cria FormData compatível com React Native/Expo
      const formData = new FormData();

      // Adiciona o arquivo de áudio no formato esperado pelo React Native
      formData.append("file", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);

      // Adiciona o modelo
      formData.append("model", "whisper-1"); // Usando whisper-1 que é mais estável

      // Faz a requisição diretamente à API da OpenAI (evita problemas com FormData do SDK)
      const transcriptionResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            // Não definir Content-Type, o fetch vai definir automaticamente com boundary
          },
          body: formData,
        }
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        let errorMessage = `Erro na API: ${transcriptionResponse.status}`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await transcriptionResponse.json();
      return data.text || "";
    } catch (error: any) {
      console.error("Erro ao transcrever áudio:", error);

      // Trata erros específicos da OpenAI
      let errorMessage =
        "Não foi possível transcrever o áudio. Tente novamente.";

      if (error?.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  // Função para lidar com o fechamento da modal
  const handleCloseRecordingModal = async () => {
    if (recording) {
      await stopRecording();
    }

    // Se há áudio gravado, transcreve
    if (recordedAudioUri) {
      setIsTranscribing(true);
      try {
        const transcribedText = await transcribeAudio(recordedAudioUri);
        // Adiciona o texto transcrito ao campo de input
        setObjetosPessoais((prev) => {
          const newText = prev
            ? `${prev}\n${transcribedText}`
            : transcribedText;
          return newText;
        });
        setShowRecordingModal(false);
        setRecordedAudioUri(null);
      } catch (error: any) {
        console.error("Erro na transcrição:", error);
        const errorMessage =
          error?.message ||
          "Não foi possível transcrever o áudio. Tente novamente.";

        Alert.alert("Erro na Transcrição", errorMessage, [
          {
            text: "OK",
            style: "default",
          },
        ]);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      setShowRecordingModal(false);
    }
  };

  const handleNextStep = () => {
    setCheckInStep3Data({
      objetosPessoais,
      nivelCombustivel,
    });
    router.push("/check-in/check-in-step-4" as RelativePathString);
  };

  const updateFuelLevelFromX = (x: number, width: number) => {
    if (width === 0) return;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newValue = Math.round(percentage * 4);
    setNivelCombustivel(newValue);
  };

  const handleSliderPress = (evt: any) => {
    if (sliderWidth === 0) return;
    const touchX = evt.nativeEvent.locationX;
    const clampedX = Math.max(0, Math.min(sliderWidth, touchX));
    const snapX = (Math.round((clampedX / sliderWidth) * 4) / 4) * sliderWidth;
    translateX.value = withSpring(snapX, { damping: 15, stiffness: 150 });
    updateFuelLevelFromX(snapX, sliderWidth);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (sliderWidthShared.value === 0) return;
      // Salva a posição atual como ponto de partida
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      if (sliderWidthShared.value === 0) return;
      // Durante o drag, calcula a nova posição baseada no movimento
      // e.translationX é o deslocamento desde o início do gesto
      const newX = Math.max(
        0,
        Math.min(sliderWidthShared.value, startX.value + e.translationX)
      );
      translateX.value = newX;
    })
    .onEnd(() => {
      if (sliderWidthShared.value > 0) {
        const finalX = Math.max(
          0,
          Math.min(sliderWidthShared.value, translateX.value)
        );
        // Snap para o valor mais próximo (0, 1/4, 1/2, 3/4, Full)
        const snapX =
          (Math.round((finalX / sliderWidthShared.value) * 4) / 4) *
          sliderWidthShared.value;
        translateX.value = withSpring(snapX, { damping: 15, stiffness: 150 });
        // Atualiza o estado apenas no final do drag
        runOnJS(updateFuelLevelFromX)(snapX, sliderWidthShared.value);
      }
    });

  return (
    <ScrollView
      className="flex-1 bg-stone-800"
      contentContainerClassName="px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md mx-auto pb-10">
        {/* Título */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-3xl font-bold text-white">
              Detalhes finais
            </Text>
            <Text className="text-2xl ml-2">🚀</Text>
          </View>
          <Text className="text-sm text-white/80">
            Para fechar a entrada do automóvel em sua oficina, preencha as
            informações abaixo.
          </Text>
        </View>

        {/* Campo de Objetos Pessoais */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-white mb-3">
            Tem objetos pessoais no interior?
          </Text>
          <View className="relative">
            <TextField className="w-full">
              <TextField.Input
                placeholder="Liste os objetos pessoais encontrados no veículo..."
                value={objetosPessoais}
                onChangeText={setObjetosPessoais}
                multiline
                numberOfLines={6}
                className="min-h-[150px] text-base"
                textAlignVertical="top"
              />
            </TextField>
            <TouchableOpacity
              className="absolute -bottom-4 right-3 p-2"
              activeOpacity={0.7}
              onPress={() => {
                // Se já tem permissão, abre a modal de gravação
                if (microphonePermissionGranted) {
                  setShowRecordingModal(true);
                  startRecording();
                } else {
                  // Sempre mostra a modal para o usuário ler o aviso primeiro
                  setShowMicrophoneModal(true);
                }
              }}
            >
              <Feather name="mic" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Slider de Combustível */}
        <View className="mb-8 mt-8">
          <Text className="text-lg font-semibold text-white mb-4">
            Quanto de combustível tem no tanque?
          </Text>

          {/* Slider Container */}
          <View className="mb-4">
            <View
              className="relative"
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setSliderWidth(width);
                sliderWidthShared.value = width;
                const initialX = (nivelCombustivel / 4) * width;
                translateX.value = initialX;
              }}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleSliderPress}
                className="py-2"
              >
                <View
                  className="h-2 bg-gray-600 rounded-full"
                  style={{ width: "100%" }}
                >
                  {/* Track preenchido */}
                  <Animated.View
                    className="h-full bg-blue-600 rounded-full absolute left-0"
                    style={useAnimatedStyle(() => {
                      if (sliderWidthShared.value > 0) {
                        return {
                          width: Math.max(
                            0,
                            Math.min(translateX.value, sliderWidthShared.value)
                          ),
                        };
                      }
                      // Fallback quando sliderWidth ainda não foi calculado
                      return {
                        width: "50%", // 1/2 = 50%
                      };
                    })}
                  />
                </View>
              </TouchableOpacity>
              {/* Handle */}
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  className="absolute top-1/2 w-6 h-6 bg-blue-600 rounded-full border-2 border-white z-10"
                  style={useAnimatedStyle(() => {
                    if (sliderWidthShared.value > 0) {
                      return {
                        left: Math.max(
                          0,
                          Math.min(
                            translateX.value - 12,
                            sliderWidthShared.value - 12
                          )
                        ),
                        marginTop: -12,
                      };
                    }
                    // Fallback quando sliderWidth ainda não foi calculado
                    return {
                      left: 138, // Aproximadamente 50% de 300 - 12
                      marginTop: -12,
                    };
                  })}
                />
              </GestureDetector>
            </View>
          </View>

          {/* Labels */}
          <View className="flex-row justify-between px-1">
            {FUEL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                onPress={() => {
                  setNivelCombustivel(level.value);
                  if (sliderWidth > 0) {
                    const newX = (level.value / 4) * sliderWidth;
                    translateX.value = withSpring(newX, {
                      damping: 15,
                      stiffness: 150,
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm ${
                    nivelCombustivel === level.value
                      ? "text-blue-400 font-semibold"
                      : "text-white/60"
                  }`}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Próximo */}
        <View className="mt-6">
          <Button onPress={handleNextStep} className="w-full">
            Próximo
          </Button>
        </View>
      </View>

      {/* Modal de Permissão do Microfone */}
      <Modal
        visible={showMicrophoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMicrophoneModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-stone-800 rounded-2xl p-6 w-full max-w-sm">
            {/* Animação Lottie do Microfone */}
            <View className="items-center mb-4">
              <View className="w-24 h-24 justify-center items-center">
                <LottieView
                  source={require("@/assets/mic.json")}
                  autoPlay
                  loop
                  style={{ width: 96, height: 96 }}
                />
              </View>
            </View>

            {/* Título */}
            <Text className="text-2xl font-bold text-white text-center mb-3">
              Permissão de Microfone
            </Text>

            {/* Mensagem */}
            <Text className="text-base text-white/80 text-center mb-6 leading-6">
              Para usar a funcionalidade de gravação de voz, precisamos da sua
              permissão para acessar o microfone do dispositivo.
            </Text>

            {/* Botões */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowMicrophoneModal(false)}
                className="flex-1 bg-stone-700 rounded-lg py-3 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <Button
                variant="primary"
                onPress={async () => {
                  const { granted } = await requestMicrophonePermission();
                  if (granted) {
                    setShowMicrophoneModal(false);
                    // Abre a modal de gravação e inicia a gravação
                    setShowRecordingModal(true);
                    startRecording();
                  } else {
                    // Permissão negada - fecha a modal (o Alert já foi mostrado)
                    setShowMicrophoneModal(false);
                  }
                }}
                className="flex-1"
              >
                Permitir
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Gravação de Áudio */}
      <Modal
        visible={showRecordingModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (recording) {
            stopRecording();
          }
          setShowRecordingModal(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-stone-800 rounded-2xl p-6 w-full max-w-sm">
            {/* Bolinha Vermelha Pulsante */}
            <View className="items-center mb-4">
              <Animated.View
                style={[
                  {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#ef4444",
                  },
                  pulseAnimatedStyle,
                ]}
              />
            </View>

            {/* Texto de Atenção */}
            <Text className="text-lg font-semibold text-white text-center mb-6">
              {recording
                ? "Atenção: Microfone sendo capturado..."
                : "Gravação finalizada"}
            </Text>

            {/* Botão Parar/Gravar Novamente */}
            <View className="mb-4">
              {recording ? (
                <Button
                  onPress={stopRecording}
                  className="w-full bg-red-600"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <Text className="text-white font-semibold">
                    Parar gravação
                  </Text>
                </Button>
              ) : (
                <Button
                  onPress={() => {
                    setRecordedAudioUri(null);
                    if (audioPlayer) {
                      audioPlayer.pause();
                    }
                    startRecording();
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Gravar novamente
                </Button>
              )}
            </View>

            {/* Player de Áudio */}
            {recordedAudioUri && (
              <View className="mt-4">
                <View className="flex-row items-center justify-center gap-4">
                  <TouchableOpacity
                    onPress={() => {
                      if (audioPlayer.playing) {
                        audioPlayer.pause();
                      } else {
                        audioPlayer.play();
                      }
                    }}
                    className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={audioPlayer.playing ? "pause" : "play"}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      audioPlayer.seekTo(0);
                      audioPlayer.pause();
                    }}
                    className="w-12 h-12 bg-gray-600 rounded-full items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Feather name="square" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Botão Fechar */}
            <TouchableOpacity
              onPress={handleCloseRecordingModal}
              className="mt-4 bg-stone-700 rounded-lg py-3 items-center justify-center"
              activeOpacity={0.7}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-semibold">
                    Transcrevendo áudio...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-semibold">Fechar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
