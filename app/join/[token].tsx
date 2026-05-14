import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useHouseholdByToken,
  useJoinHousehold,
} from "../../lib/hooks/useHouseholds";
import { useAuthStore } from "../../store/auth.store";
import { useHouseholdStore } from "../../store/household.store";

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { setActiveHousehold } = useHouseholdStore();

  const {
    data: household,
    isLoading,
    isError,
    error,
  } = useHouseholdByToken(token ?? null);
  const joinHousehold = useJoinHousehold();

  function handleJoin() {
    if (!token) return;
    joinHousehold.mutate(token, {
      onSuccess: (joined) => {
        setActiveHousehold(joined);
        router.replace("/");
      },
    });
  }

  if (authLoading || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError || !household) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Invalid Invite
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
          This invite link is invalid or has expired.
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-3 px-8"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
      <Text className="text-3xl font-bold text-primary-700 mb-2">
        You&apos;re invited!
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-2">
        Join the household:
      </Text>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-10">
        {household.name}
      </Text>

      {isAuthenticated ? (
        // ── Logged-in flow ─────────────────────────────────────────────
        <>
          {joinHousehold.isError && (
            <Text className="text-danger-500 text-sm mb-4">
              Failed to join. Please try again.
            </Text>
          )}
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 w-full items-center mb-3"
            onPress={handleJoin}
            disabled={joinHousehold.isPending}
            activeOpacity={0.75}
          >
            {joinHousehold.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Join Household
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            activeOpacity={0.7}
          >
            <Text className="text-gray-500 dark:text-gray-400">Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        // ── Unauthenticated flow ────────────────────────────────────────
        <>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Sign in or create an account to join.
          </Text>
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 w-full items-center mb-3"
            onPress={() =>
              router.push({
                pathname: "/(auth)/register",
                params: { invite_token: token },
              })
            }
            activeOpacity={0.75}
          >
            <Text className="text-white font-semibold text-base">
              Create Account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-gray-300 dark:border-gray-600 rounded-xl py-4 w-full items-center"
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { invite_token: token },
              })
            }
            activeOpacity={0.75}
          >
            <Text className="text-gray-700 dark:text-gray-300 font-semibold text-base">
              Sign In
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
