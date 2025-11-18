import { useMainStore } from "@/store/useMain.store";
import Feather from "@expo/vector-icons/Feather";
import { RelativePathString, useRouter } from "expo-router";
import { Button, Switch, TextField } from "heroui-native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  VehicleData,
  vehicleService,
  type ClienteData,
} from "../../../services/vehicle.service";

export default function CheckInIndex() {
  const router = useRouter();
  const { vehicleData, setVehicleData } = useMainStore();
  const [placa, setPlaca] = useState("");
  const [clienteEncontrado, setClienteEncontrado] =
    useState<ClienteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outraPessoaEntregando, setOutraPessoaEntregando] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [openModalRegister, setOpenModalRegister] = useState(false);

  // Função para converter texto para maiúsculo
  const handlePlacaChange = (text: string) => {
    setPlaca(text.toUpperCase());
    // Limpa os dados do cliente quando a placa muda
    setClienteEncontrado(null);
  };

  // Função para buscar dados do cliente pela placa
  const handlePlaca = async () => {
    if (!placa.trim()) {
      Toast.show({
        type: "error",
        text1: "Placa obrigatória",
        text2: "Digite a placa do veículo para buscar",
      });
      return;
    }

    setIsLoading(true);
    setClienteEncontrado(null);

    try {
      const result = await vehicleService.findByPlaca(placa);

      if (result.success && result.vehicle?.cliente) {
        setClienteEncontrado(result.vehicle.cliente);
        Toast.show({
          type: "success",
          text1: "Veículo encontrado",
          text2: "Dados do cliente carregados com sucesso",
        });

        const vehicleData: VehicleData = {
          id: result.vehicle.id,
          placa: result.vehicle.placa,
          marca: result.vehicle.marca,
          modelo: result.vehicle.modelo,
          ano: result.vehicle.ano,
          cor: result.vehicle.cor,
          cliente_id: result.vehicle.cliente_id,
          cliente: result.vehicle.cliente,
        };

        setVehicleData(vehicleData);
      } else {
        setOpenModalRegister(true);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro na busca",
        text2: error.message || "Ocorreu um erro ao buscar o veículo",
      });
      setClienteEncontrado(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!vehicleData) {
      Toast.show({
        type: "error",
        text1: "Veículo não encontrado",
        text2: "Nenhum veículo encontrado para atualizar",
      });
      return;
    }
    const vehicleDataToUpdate: VehicleData = {
      ...vehicleData,
      outraPessoaEntregando: outraPessoaEntregando,
      nomeResponsavel: nomeResponsavel,
      telefoneResponsavel: telefoneResponsavel,
    };
    setVehicleData(vehicleDataToUpdate);
    router.push("/check-in/check-in-step-3" as RelativePathString);
  };

  return (
    <ScrollView
      className="flex-1 bg-background pb-10"
      contentContainerClassName="px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md mx-auto pb-10">
        {/* Título */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Check-In
          </Text>
          <Text className="text-sm text-white">
            Digite a placa do veículo para iniciar o check-in
          </Text>
        </View>

        {/* Campo de Placa */}
        <View className="mb-6">
          <TextField isRequired className="w-full">
            <TextField.Label>Placa do Veículo</TextField.Label>
            <View className="flex-row items-center relative">
              <TextField.Input
                placeholder="Ex: ABC1234"
                autoCapitalize="characters"
                autoComplete="off"
                value={placa}
                onChangeText={handlePlacaChange}
                maxLength={7}
                className="pr-12 w-full"
              />
              <TouchableOpacity
                onPress={handlePlaca}
                className="absolute right-2 p-2"
                activeOpacity={0.7}
                disabled={isLoading || !placa.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4a9eff" />
                ) : (
                  <Feather
                    name="search"
                    size={24}
                    color={placa.trim() && !isLoading ? "#4a9eff" : "#999999"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </TextField>
        </View>

        {/* Dados do Cliente (quando encontrado) */}
        {clienteEncontrado && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Dados do Cliente
            </Text>

            <View className="gap-4">
              {/* Nome */}
              <TextField className="w-full">
                <TextField.Label>Nome</TextField.Label>
                <TextField.Input
                  value={clienteEncontrado.nome}
                  editable={false}
                />
              </TextField>

              {/* Telefone */}
              <TextField className="w-full">
                <TextField.Label>Telefone</TextField.Label>
                <TextField.Input
                  value={clienteEncontrado.telefone}
                  editable={false}
                />
              </TextField>

              {/* Email */}
              <TextField className="w-full">
                <TextField.Label>E-mail</TextField.Label>
                <TextField.Input
                  value={clienteEncontrado.email}
                  editable={false}
                />
              </TextField>

              {/* Endereço */}
              <TextField className="w-full">
                <TextField.Label>Endereço</TextField.Label>
                <TextField.Input
                  value={clienteEncontrado.endereco}
                  editable={false}
                  multiline
                  numberOfLines={2}
                />
              </TextField>
            </View>

            {/* Switch - Outra pessoa entregando */}
            <View className="flex-row items-center gap-3 mt-4">
              <Switch
                isSelected={outraPessoaEntregando}
                onSelectedChange={(value) => {
                  setOutraPessoaEntregando(value);
                  // Limpa os campos quando desativar o switch
                  if (!value) {
                    setNomeResponsavel("");
                    setTelefoneResponsavel("");
                  }
                }}
              />
              <Text className="text-foreground flex-1">
                Outra pessoa entregando o carro
              </Text>
            </View>

            {/* Campos do Responsável (quando switch ativado) */}
            {outraPessoaEntregando && (
              <View className="gap-4 mt-4">
                {/* Nome do Responsável */}
                <TextField isRequired className="w-full">
                  <TextField.Label>Nome do Responsável</TextField.Label>
                  <TextField.Input
                    placeholder="Digite o nome do responsável"
                    value={nomeResponsavel}
                    onChangeText={setNomeResponsavel}
                    autoCapitalize="words"
                  />
                </TextField>

                {/* Telefone do Responsável */}
                <TextField isRequired className="w-full">
                  <TextField.Label>Telefone do Responsável</TextField.Label>
                  <TextField.Input
                    placeholder="Digite o telefone do responsável"
                    value={telefoneResponsavel}
                    onChangeText={setTelefoneResponsavel}
                    keyboardType="phone-pad"
                  />
                </TextField>
              </View>
            )}
          </View>
        )}

        {/* Botão Avançar */}
        {clienteEncontrado && (
          <View className="mt-6">
            <Button onPress={handleNextStep} className="w-full">
              Avançar
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
