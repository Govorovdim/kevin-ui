import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AiChat from "../../components/AiChat";

import {
  useHouseholds,
  useCreateHousehold,
} from "../../lib/hooks/useHouseholds";
import { useAllHouseholdsYearOverview } from "../../lib/hooks/useOverview";
import { useHouseholdStore } from "../../store/household.store";
import HouseholdCard from "../../components/HouseholdCard";
import CurrencyPicker from "../../components/CurrencyPicker";
import HomeMenu from "../../components/HomeMenu";
import { formatCurrency } from "../../lib/format";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_HOUSEHOLD_NAME = "My Household";
const DEFAULT_HOUSEHOLD_CURRENCY = "USD";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [householdName, setHouseholdName] = useState("");
  const [householdNameError, setHouseholdNameError] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Guards the one-time automatic household creation for brand-new users
  const autoCreateTriggered = useRef(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    data: households,
    isLoading: householdsLoading,
    error: householdsError,
    refetch: refetchHouseholds,
  } = useHouseholds();
  const { activeHousehold, _hasHydrated, setActiveHousehold } =
    useHouseholdStore();
  const createHousehold = useCreateHousehold();
  const { data: allOverview, isLoading: allOverviewLoading } =
    useAllHouseholdsYearOverview(
      households?.map((h) => h.id) ?? [],
      CURRENT_YEAR,
    );

  // If there's a persisted active household, redirect to the household (tabs) page
  useEffect(() => {
    if (_hasHydrated && activeHousehold) {
      router.replace("/(tabs)");
    }
  }, [_hasHydrated, activeHousehold, router]);

  // Brand-new user (no households): silently create a default one for them
  // instead of showing a dedicated onboarding screen.
  useEffect(() => {
    if (
      !householdsLoading &&
      !householdsError &&
      households &&
      households.length === 0 &&
      !autoCreateTriggered.current
    ) {
      autoCreateTriggered.current = true;
      createHousehold.mutate({
        name: DEFAULT_HOUSEHOLD_NAME,
        currency: DEFAULT_HOUSEHOLD_CURRENCY,
      });
    }
  }, [householdsLoading, householdsError, households, createHousehold]);

  // Reset form whenever it is hidden
  useEffect(() => {
    if (!showCreateForm) {
      setHouseholdName("");
      setHouseholdNameError(false);
      setCurrency("USD");
    }
  }, [showCreateForm]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleRetry() {
    refetchHouseholds();
  }

  function handleCreate() {
    const name = householdName.trim();
    if (!name) {
      setHouseholdNameError(true);
      return;
    }
    createHousehold.mutate(
      { name, currency },
      {
        onSuccess: () => {
          setShowCreateForm(false);
        },
      },
    );
  }

  function handleSelectHousehold(
    household: Parameters<typeof setActiveHousehold>[0],
  ) {
    setActiveHousehold(household);
    router.push("/(tabs)");
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  // Also covers the brief moment while we auto-create the first household.
  const isAutoCreating =
    (households && households.length === 0) || createHousehold.isPending;

  if (householdsLoading || (isAutoCreating && !householdsError)) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Error (e.g. backend is down) ──────────────────────────────────────────
  if (householdsError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-8">
        <Text className="text-6xl mb-4">🔌</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Connection Error
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base text-center mb-8">
          Unable to reach the server. Please check that the backend is up and
          running, then try again.
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-xl px-8 py-3 items-center"
          onPress={handleRetry}
        >
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Households list ────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Max-width content wrapper */}
        <View
          style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}
          className="px-4 pt-4"
        >
          {/* ── Header row ──────────────────────────────────────────────────── */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              My Households
            </Text>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              className="w-9 h-9 items-center justify-center"
            >
              <Text className="text-gray-700 dark:text-gray-300 text-xl">
                ☰
              </Text>
            </TouchableOpacity>
          </View>

          <HomeMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
          />

          {/* ── AI Chat ────────────────────────────────────────────────────── */}
          <AiChat
            households={households?.map((h) => ({ id: h.id, name: h.name }))}
          />

          {/* ── All households summary ──────────────────────────────────────── */}
          {allOverview && !allOverviewLoading && (
            <View className="bg-primary-600 rounded-2xl p-5 mb-5">
              <Text className="text-primary-200 text-xs font-medium mb-1">
                Total Net Worth
              </Text>
              <Text className="text-white text-4xl font-bold mb-4">
                {formatCurrency(allOverview.net_worth, "USD", {
                  decimals: false,
                })}
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <View className="bg-primary-800 dark:bg-primary-900 rounded-full px-3 py-1.5">
                  <Text className="text-primary-200 text-xs font-medium">
                    Portfolio{" "}
                    {formatCurrency(allOverview.portfolio_value, "USD", {
                      decimals: false,
                    })}
                  </Text>
                </View>
                <View className="bg-primary-800 dark:bg-primary-900 rounded-full px-3 py-1.5">
                  <Text className="text-primary-200 text-xs font-medium">
                    Liabilities{" "}
                    {formatCurrency(allOverview.total_debt, "USD", {
                      decimals: false,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Inline create form ──────────────────────────────────────────── */}
          {showCreateForm && (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                New Household
              </Text>

              <TextInput
                className={`bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base mb-2 ${
                  householdNameError
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
                placeholder="Household name"
                placeholderTextColor="#9ca3af"
                value={householdName}
                onChangeText={(t) => {
                  setHouseholdName(t);
                  if (householdNameError) setHouseholdNameError(false);
                }}
                autoCapitalize="words"
                autoFocus
              />

              <CurrencyPicker value={currency} onChange={setCurrency} />

              <TouchableOpacity
                className="bg-primary-600 rounded-xl py-3 items-center mb-3"
                onPress={handleCreate}
                disabled={createHousehold.isPending}
              >
                {createHousehold.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Create
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-1"
                onPress={() => setShowCreateForm(false)}
              >
                <Text className="text-gray-400 dark:text-gray-500 text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Create new household button ─────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => setShowCreateForm((v) => !v)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-center"
            style={{ gap: 8 }}
          >
            <Text className="text-primary-600 text-xl font-bold leading-none">
              {showCreateForm ? "×" : "+"}
            </Text>
            <Text className="text-primary-600 font-semibold text-base">
              {showCreateForm ? "Cancel" : "New Household"}
            </Text>
          </TouchableOpacity>

          {/* ── Household cards ─────────────────────────────────────────────── */}
          {households?.map((household) => (
            <HouseholdCard
              key={household.id}
              household={household}
              onPress={() => handleSelectHousehold(household)}
            />
          ))}
        </View>
        {/* end max-width wrapper */}
      </ScrollView>
    </SafeAreaView>
  );
}
