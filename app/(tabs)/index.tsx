import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AiChat from "../../components/AiChat";

import { useHouseholds } from "../../lib/hooks/useHouseholds";
import { useYearOverview, useYearMonthlyDebt, useYearMonthlyPortfolio } from "../../lib/hooks/useOverview";
import { useHouseholdStore } from "../../store/household.store";
import LineChart from "../../components/LineChart";
import BurgerMenu from "../../components/BurgerMenu";
import { formatCurrency } from "../../lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthSummary {
  month: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMonthlyArray(months: MonthSummary[], key: keyof MonthSummary): number[] {
  const arr = new Array(12).fill(0);
  months.forEach((m) => {
    arr[m.month - 1] = m[key];
  });
  return arr;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [menuVisible, setMenuVisible] = useState(false);

  const { isLoading: householdsLoading } = useHouseholds();
  const { activeHousehold, clearActiveHousehold } = useHouseholdStore();

  const { data: overview, isLoading: overviewLoading } = useYearOverview(activeHousehold?.id ?? null, year);
  const { data: monthlyDebt } = useYearMonthlyDebt(activeHousehold?.id ?? null, year);
  const { data: monthlyPortfolio } = useYearMonthlyPortfolio(activeHousehold?.id ?? null, year);

  // If no active household after households have loaded, go back to home
  useEffect(() => {
    if (!householdsLoading && !activeHousehold) {
      router.replace("/(home)");
    }
  }, [householdsLoading, activeHousehold, router]);

  // ── Loading: overview data ─────────────────────────────────────────────────
  if (overviewLoading || !overview) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Derived chart data ─────────────────────────────────────────────────────
  const incomeData = toMonthlyArray(overview.months, "total_income");
  const expensesData = toMonthlyArray(overview.months, "total_expenses");
  const portfolioData = monthlyPortfolio ?? new Array(12).fill(0);
  const debtData = monthlyDebt ?? new Array(12).fill(0);

  // ── Happy path ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Max-width content wrapper (keeps layout sane on wide screens) */}
        <View style={{ maxWidth: 720, width: "100%", alignSelf: "center" }} className="px-4 pt-4">
          {/* ── 1. Header row ─────────────────────────────────────────────── */}
          <View className="mb-5">
            {/* Back button + Household name + burger on same line */}
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity
                onPress={() => {
                  clearActiveHousehold();
                  router.replace("/(home)");
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-8"
              >
                <Ionicons name="chevron-back" size={28} color="#2563eb" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1 mx-3" numberOfLines={1}>
                {activeHousehold?.name}
              </Text>
              <TouchableOpacity onPress={() => setMenuVisible(true)} className="w-8 h-8 items-center justify-center">
                <Text className="text-gray-700 dark:text-gray-300 text-xl">☰</Text>
              </TouchableOpacity>
            </View>

            {/* Year navigation below the name */}
            <View className="flex-row items-center justify-center" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setYear((y) => y - 1)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-8 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={28} color="#2563eb" />
              </TouchableOpacity>

              <Text className="text-xl font-bold text-gray-900 dark:text-white w-14 text-center">{year}</Text>

              <TouchableOpacity
                onPress={() => setYear((y) => Math.min(y + 1, CURRENT_YEAR))}
                disabled={year >= CURRENT_YEAR}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-8 items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={28} color={year >= CURRENT_YEAR ? "#d1d5db" : "#2563eb"} />
              </TouchableOpacity>
            </View>
          </View>

          <BurgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

          {/* ── AI Chat ───────────────────────────────────────────────────── */}
          <AiChat year={year} householdId={activeHousehold?.id} householdName={activeHousehold?.name} />

          {/* ── 2. Net Worth hero card ────────────────────────────────────── */}
          <View className="bg-primary-600 rounded-2xl p-5 mb-5">
            <Text className="text-primary-200 text-xs font-medium mb-1">Net Worth</Text>
            <Text className="text-white text-4xl font-bold mb-4">
              {formatCurrency(overview.net_worth, activeHousehold?.currency ?? "USD", { decimals: false })}
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <View className="bg-primary-800 dark:bg-primary-900 rounded-full px-3 py-1.5">
                <Text className="text-primary-200 text-xs font-medium">
                  Portfolio{" "}
                  {formatCurrency(overview.portfolio_value, activeHousehold?.currency ?? "USD", { decimals: false })}
                </Text>
              </View>
              <View className="bg-primary-800 dark:bg-primary-900 rounded-full px-3 py-1.5">
                <Text className="text-primary-200 text-xs font-medium">
                  Debt {formatCurrency(overview.total_debt, activeHousehold?.currency ?? "USD", { decimals: false })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 3. Summary strip ─────────────────────────────────────────── */}
          <View className="flex-row mb-5" style={{ gap: 10 }}>
            {/* Income */}
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Income</Text>
              <Text className="text-success-600 font-bold text-sm" numberOfLines={1}>
                {formatCurrency(overview.total_income, activeHousehold?.currency ?? "USD", { decimals: false })}
              </Text>
            </View>

            {/* Expenses */}
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Expenses</Text>
              <Text className="text-danger-600 font-bold text-sm" numberOfLines={1}>
                {formatCurrency(overview.total_expenses, activeHousehold?.currency ?? "USD", { decimals: false })}
              </Text>
            </View>

            {/* Portfolio */}
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Portfolio</Text>
              <Text className="text-primary-600 font-bold text-sm" numberOfLines={1}>
                {formatCurrency(overview.portfolio_value, activeHousehold?.currency ?? "USD", { decimals: false })}
              </Text>
            </View>
          </View>

          {/* ── 4. Cash Flow section ─────────────────────────────────────── */}
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Cash Flow</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
            <LineChart
              datasets={[
                { data: incomeData, color: "#16a34a", label: "Income" },
                { data: expensesData, color: "#dc2626", label: "Expenses" },
              ]}
              height={160}
              currency={activeHousehold?.currency ?? "USD"}
            />
          </View>

          {/* ── 5. Portfolio & Liabilities section ──────────────────── */}
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Portfolio &amp; Liabilities
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
            <LineChart
              datasets={[
                { data: portfolioData, color: "#2563eb", label: "Portfolio" },
                { data: debtData, color: "#ef4444", label: "Liabilities" },
              ]}
              height={140}
              showZeroLine
              currency={activeHousehold?.currency ?? "USD"}
            />
          </View>

          {/* ── 6. Months section ────────────────────────────────────────── */}
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Months</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl mb-10 overflow-hidden shadow-sm">
            {MONTH_NAMES.map((name, index) => {
              const monthNum = index + 1;
              const monthData = overview.months.find((m) => m.month === monthNum);
              const isEmpty =
                !monthData ||
                (monthData.total_income === 0 && monthData.total_expenses === 0 && monthData.net_savings === 0);

              const monthPortfolio = monthlyPortfolio?.[index] ?? 0;

              return (
                <TouchableOpacity
                  key={monthNum}
                  onPress={() =>
                    router.push({
                      pathname: "/month/[year]/[month]",
                      params: { year, month: monthNum },
                    })
                  }
                  className={
                    "flex-row items-center justify-between px-4 py-3" +
                    (index < 11 ? " border-b border-gray-100 dark:border-gray-700" : "")
                  }
                >
                  {/* Month name */}
                  <Text
                    className={
                      isEmpty
                        ? "text-gray-300 dark:text-gray-600 font-medium text-sm w-24"
                        : "text-gray-900 dark:text-white font-medium text-sm w-24"
                    }
                  >
                    {name}
                  </Text>

                  {/* Financial values */}
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    {/* Income */}
                    <Text
                      className={isEmpty ? "text-gray-300 dark:text-gray-600 text-xs" : "text-success-600 text-xs"}
                      style={{ width: 68, textAlign: "right" }}
                      numberOfLines={1}
                    >
                      {formatCurrency(monthData?.total_income ?? 0, activeHousehold?.currency ?? "USD", {
                        decimals: false,
                      })}
                    </Text>

                    {/* Expenses */}
                    <Text
                      className={isEmpty ? "text-gray-300 dark:text-gray-600 text-xs" : "text-danger-600 text-xs"}
                      style={{ width: 68, textAlign: "right" }}
                      numberOfLines={1}
                    >
                      {formatCurrency(monthData?.total_expenses ?? 0, activeHousehold?.currency ?? "USD", {
                        decimals: false,
                      })}
                    </Text>

                    {/* Portfolio */}
                    <Text
                      className={isEmpty ? "text-gray-300 dark:text-gray-600 text-xs" : "text-primary-600 text-xs"}
                      style={{ width: 68, textAlign: "right" }}
                      numberOfLines={1}
                    >
                      {formatCurrency(monthPortfolio, activeHousehold?.currency ?? "USD", { decimals: false })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {/* ── end max-width wrapper */}
      </ScrollView>
    </SafeAreaView>
  );
}
