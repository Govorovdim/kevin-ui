import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { storage } from "../../lib/storage";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { useHouseholdStore } from "../../store/household.store";

const schema = z.object({
  username: z.string().min(3, "Min 3 characters"),
  password: z.string().min(8, "Min 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const { setActiveHousehold } = useHouseholdStore();
  const { invite_token } = useLocalSearchParams<{ invite_token?: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post("/api/v1/auth/login", {
        username: data.username,
        password: data.password,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      await storage.setItem("access_token", data.access_token);
      await storage.setItem("refresh_token", data.refresh_token);
      setToken(data.access_token);
      // If we came from an invite link, join the household
      if (invite_token) {
        // We need to wait for token to propagate, so do it directly
        try {
          const res = await api.post(`/api/v1/households/join/${invite_token}`);
          setActiveHousehold(res.data);
        } catch (_) {
          // ignore join errors — user still logs in
        }
      }
      // AuthGuard will redirect to "/"
    },
  });

  return (
    <View className="flex-1 justify-center bg-white dark:bg-gray-900">
      <View
        style={{
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text className="text-3xl font-bold text-primary-700 mb-2">
          Welcome back
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-8">
          Sign in to Kevin
        </Text>

        {/* Username */}
        <View className="mb-4">
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Username"
                autoCapitalize="none"
                onChangeText={(t) => {
                  onChange(t);
                  if (mutation.isError) mutation.reset();
                }}
                value={value}
              />
            )}
          />
          <Text className="text-danger-500 text-xs mt-1 h-4">
            {errors.username?.message ?? ""}
          </Text>
        </View>

        {/* Password */}
        <View className="mb-6">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Password"
                secureTextEntry
                onChangeText={(t) => {
                  onChange(t);
                  if (mutation.isError) mutation.reset();
                }}
                value={value}
              />
            )}
          />
          <Text className="text-danger-500 text-xs mt-1 h-4">
            {errors.password?.message ??
              (mutation.isError ? "Invalid username or password" : "")}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center"
          onPress={handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-primary-600">
            Don&apos;t have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
