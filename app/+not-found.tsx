import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <View className="flex-1 items-center justify-center p-6 bg-white dark:bg-gray-950">
        <Text className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          404
        </Text>
        <Text className="text-lg text-gray-600 dark:text-gray-400 mt-2 text-center">
          Oops! The page you're looking for doesn't exist.
        </Text>

        <Link href="/" className="mt-10">
          <Text className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
            Go back home
          </Text>
        </Link>
      </View>
    </>
  );
}
