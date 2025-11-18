import { CustomDrawerContent } from "@/components/custom-drawer-content";
import Feather from "@expo/vector-icons/Feather";
import { Drawer } from "expo-router/drawer";

export default function ProtectedLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerContentContainerStyle: { backgroundColor: "#1a1a1a" },
        drawerStyle: {
          backgroundColor: "#1a1a1a",
          width: 280,
        },
        drawerActiveTintColor: "#4a9eff",
        drawerInactiveTintColor: "#999999",
        drawerLabelStyle: {
          marginLeft: 0,
          fontSize: 16,
        },
        headerStyle: {
          backgroundColor: "#000000",
        },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="check-in"
        options={{
          drawerLabel: "Check-In",
          title: "Check-In",
          drawerIcon: ({ color, size }) => (
            <Feather name="log-in" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="check-out"
        options={{
          drawerLabel: "Check-Out",
          title: "Check-Out",
          drawerIcon: ({ color, size }) => (
            <Feather name="log-out" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="meu-perfil"
        options={{
          drawerLabel: "Meu Perfil",
          title: "Meu Perfil",
          drawerIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
