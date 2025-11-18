import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter, type Href } from "expo-router";
import { Button, TextField } from "heroui-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { authService, SignInData } from "../../services/auth.service";

// Schema de validação com Zod
const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  // Mutation para login usando TanStack Query
  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      const result = await authService.signIn(data);
      return result;
    },
    onSuccess: (result) => {
      if (result?.success) {
        Toast.show({
          type: "success",
          text1: "Login",
          text2: "Login realizado com sucesso",
        });
        setTimeout(() => {
          router.replace("/(protected)/" as Href);
        }, 4000);
      }
    },
    onError: (error: any) => {
      console.log("❌ onError chamado com erro:", error);
      Toast.show({
        type: "error",
        text1: "Erro no login",
        text2: error?.message || "Ocorreu um erro ao fazer login",
      });
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("📝 onSubmit chamado com dados:", data);
    // Chama a mutation com os dados do formulário
    signInMutation.mutate({
      email: data.email,
      password: data.senha,
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
              Entrar
            </Text>
            <Text className="text-sm text-default-500">
              Digite suas credenciais para acessar sua conta
            </Text>
          </View>

          {/* Formulário */}
          <View className="gap-4">
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

            {/* Link Esqueci Senha */}
            <View className="flex-row justify-end mt-2">
              <Link href="/(auth)/esqueci-senha">
                <Text className="text-primary text-sm font-semibold">
                  Esqueci minha senha
                </Text>
              </Link>
            </View>

            {/* Botão de Login */}
            <Button
              size="lg"
              variant="primary"
              className="w-full mt-6"
              isDisabled={signInMutation.isPending}
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
              {signInMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>

            {/* Link para Cadastro */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-white text-sm">Não tem uma conta? </Text>
              <Link href="/(auth)/cadastro">
                <Text className="text-white font-semibold text-sm">
                  Criar conta
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
