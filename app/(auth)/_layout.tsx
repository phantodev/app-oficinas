import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
        }}
      />
      <Stack.Screen
        name="cadastro"
        options={{
          title: "Cadastro",
        }}
      />
      <Stack.Screen
        name="esqueci-senha"
        options={{
          title: "Esqueci minha senha",
        }}
      />
    </Stack>
  );
}
