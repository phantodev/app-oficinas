import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { Button, TextField } from "heroui-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { authService, SignUpData } from "../../services/auth.service";

// Schema de validação com Zod
const cadastroSchema = z
  .object({
    nome: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),
    email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
    senha: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),
    confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type CadastroFormData = z.infer<typeof cadastroSchema>;

export default function CadastroScreen() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  // Mutation para cadastro usando TanStack Query
  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const result = await authService.signUp(data);
      return result;
    },
    onSuccess: (result) => {
      if (result?.success) {
        Toast.show({
          type: "success",
          text1: "Cadastro",
          text2: "Cadastro realizado com sucesso",
        });
        router.replace("/(auth)/login");
      }
    },
    onError: (error: any) => {
      console.log("❌ onError chamado com erro:", error);
      Toast.show({
        type: "error",
        text1: "Hello",
        text2: "This is some something 👋",
      });
    },
  });

  const onSubmit = async (data: CadastroFormData) => {
    console.log("📝 onSubmit chamado com dados:", data);
    // Chama a mutation com os dados do formulário
    signUpMutation.mutate({
      email: data.email,
      password: data.senha,
      nome: data.nome,
    });
  };
  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="flex-1 justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md mx-auto">
          {/* Título */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Criar Conta
            </Text>
            <Text className="text-sm text-default-500">
              Preencha os dados abaixo para se cadastrar
            </Text>
          </View>

          {/* Formulário */}
          <View className="gap-4">
            {/* Campo Nome */}
            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  isRequired
                  isInvalid={!!errors.nome}
                  className="w-full"
                >
                  <TextField.Label>Nome completo</TextField.Label>
                  <TextField.Input
                    placeholder="Digite seu nome completo"
                    autoCapitalize="words"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors.nome && (
                    <TextField.ErrorMessage>
                      {errors.nome.message}
                    </TextField.ErrorMessage>
                  )}
                </TextField>
              )}
            />

            {/* Campo Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  isRequired
                  isInvalid={!!errors.email}
                  className="w-full"
                >
                  <TextField.Label>E-mail</TextField.Label>
                  <TextField.Input
                    placeholder="Digite seu e-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors.email && (
                    <TextField.ErrorMessage>
                      {errors.email.message}
                    </TextField.ErrorMessage>
                  )}
                </TextField>
              )}
            />

            {/* Campo Senha */}
            <Controller
              control={control}
              name="senha"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  isRequired
                  isInvalid={!!errors.senha}
                  className="w-full"
                >
                  <TextField.Label>Senha</TextField.Label>
                  <TextField.Input
                    placeholder="Digite sua senha"
                    autoCapitalize="none"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors.senha && (
                    <TextField.ErrorMessage>
                      {errors.senha.message}
                    </TextField.ErrorMessage>
                  )}
                </TextField>
              )}
            />

            {/* Campo Confirmar Senha */}
            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  isRequired
                  isInvalid={!!errors.confirmarSenha}
                  className="w-full"
                >
                  <TextField.Label>Confirma Senha</TextField.Label>
                  <TextField.Input
                    placeholder="Confirme sua senha"
                    autoCapitalize="none"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors.confirmarSenha && (
                    <TextField.ErrorMessage>
                      {errors.confirmarSenha.message}
                    </TextField.ErrorMessage>
                  )}
                </TextField>
              )}
            />

            {/* Botão de Cadastro */}
            <Button
              size="lg"
              variant="primary"
              className="w-full mt-6"
              isDisabled={signUpMutation.isPending}
              onPress={() => {
                handleSubmit(
                  (data) => {
                    onSubmit(data);
                  },
                  (errors) => {
                    console.log(
                      "❌ handleSubmit - erros de validação:",
                      errors
                    );
                  }
                )();
              }}
            >
              {signUpMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>

            {/* Link para Login */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-white text-sm">Já tem uma conta? </Text>
              <Link href="/(auth)/login">
                <Text className="text-white font-semibold text-sm">
                  Fazer login
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
