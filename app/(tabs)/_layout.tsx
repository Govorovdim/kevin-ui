import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
