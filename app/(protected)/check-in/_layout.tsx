import { Stack } from "expo-router";

export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#292524" },
        presentation: "modal",
        animation: "slide_from_right",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Check-In - Passo 1",
        }}
      />
      <Stack.Screen
        name="check-in-step-2"
        options={{
          title: "Check-In - Passo 2",
        }}
      />
      <Stack.Screen
        name="check-in-step-3"
        options={{
          title: "Check-In - Passo 3",
        }}
      />
      <Stack.Screen
        name="check-in-step-4"
        options={{
          title: "Check-In - Passo 4",
        }}
      />
      <Stack.Screen
        name="check-in-step-5"
        options={{
          title: "Check-In - Passo 5",
        }}
      />
      <Stack.Screen
        name="check-in-step-6"
        options={{
          title: "Check-In - Passo 6",
        }}
      />
      <Stack.Screen
        name="check-in-step-7"
        options={{
          title: "Check-In - Passo 7",
        }}
      />
    </Stack>
  );
}
