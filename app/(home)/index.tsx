import { useEffect, useState } from "react";
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [householdName, setHouseholdName] = useState("");
  const [householdNameError, setHouseholdNameError] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: households, isLoading: householdsLoading } = useHouseholds();
  const { setActiveHousehold } = useHouseholdStore();
  const createHousehold = useCreateHousehold();
  const { data: allOverview, isLoading: allOverviewLoading } =
    useAllHouseholdsYearOverview(
      households?.map((h) => h.id) ?? [],
      CURRENT_YEAR,
    );

  // Reset form whenever it is hidden
  useEffect(() => {
    if (!showCreateForm) {
      setHouseholdName("");
      setHouseholdNameError(false);
      setCurrency("USD");
    }
  }, [showCreateForm]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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
  if (householdsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Onboarding (no households yet) ────────────────────────────────────────
  if (!households || households.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-8">
        <Text className="text-6xl mb-4">🏠</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Welcome to Kevin
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base text-center mb-8">
          Create a household to get started
        </Text>

        <TextInput
          className={`w-full bg-white dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base mb-4 ${
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
        />

        <CurrencyPicker value={currency} onChange={setCurrency} />

        <TouchableOpacity
          className="w-full bg-primary-600 rounded-xl py-4 items-center"
          onPress={handleCreate}
          disabled={createHousehold.isPending}
        >
          {createHousehold.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Create Household
            </Text>
          )}
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
                    Debt{" "}
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
          {households.map((household) => (
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
