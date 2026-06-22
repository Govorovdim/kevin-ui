import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useYearOverview } from "../lib/hooks/useOverview";
import type { Household, YearOverview } from "../lib/types";
import { formatCurrency } from "../lib/format";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  household: Household;
  onPress: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "orange";
}) {
  const textColor =
    color === "green"
      ? "text-success-600"
      : color === "red"
        ? "text-danger-600"
        : color === "orange"
          ? "text-warning-600"
          : "text-primary-600";

  return (
    <View className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 items-center">
      <Text className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
        {label}
      </Text>
      <Text className={`${textColor} font-semibold text-xs`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LoadingCard() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 shadow-sm items-center justify-center h-28">
      <ActivityIndicator size="small" color="#2563eb" />
    </View>
  );
}

function CardContent({
  household,
  overview,
}: {
  household: Household;
  overview: YearOverview;
}) {
  const currency = household.currency ?? "USD";

  return (
    <>
      {/* Top row: name + chevron */}
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-xl font-bold text-gray-900 dark:text-white flex-1 mr-2"
          numberOfLines={1}
        >
          {household.name}
        </Text>
        <Text className="text-gray-400 dark:text-gray-500 text-2xl leading-none">
          ›
        </Text>
      </View>

      {/* Badge row: member count + currency */}
      <View className="flex-row items-center mb-4" style={{ gap: 8 }}>
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
          <Text className="text-gray-600 dark:text-gray-300 text-xs">
            👥 {household.member_count}{" "}
            {household.member_count === 1 ? "member" : "members"}
          </Text>
        </View>
        <View className="bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
          <Text className="text-gray-600 dark:text-gray-300 text-xs font-semibold">
            {currency}
          </Text>
        </View>
      </View>

      {/* Net Worth hero number */}
      <Text className="text-primary-600 text-3xl font-bold mb-4">
        {formatCurrency(overview.net_worth, currency, { decimals: false })}
      </Text>

      {/* Stat pills */}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        <StatPill
          label="Income"
          value={formatCurrency(overview.total_income, currency, {
            decimals: false,
          })}
          color="green"
        />
        <StatPill
          label="Expenses"
          value={formatCurrency(overview.total_expenses, currency, {
            decimals: false,
          })}
          color="orange"
        />
        <StatPill
          label="Portfolio"
          value={formatCurrency(overview.portfolio_value, currency, {
            decimals: false,
          })}
          color="blue"
        />
        <StatPill
          label="Liabilities"
          value={formatCurrency(overview.total_debt, currency, {
            decimals: false,
          })}
          color="red"
        />
      </View>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HouseholdCard({ household, onPress }: Props) {
  const { data: overview, isLoading } = useYearOverview(
    household.id,
    CURRENT_YEAR,
  );

  if (isLoading || !overview) {
    return <LoadingCard />;
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 shadow-sm active:opacity-75"
    >
      <CardContent household={household} overview={overview} />
    </Pressable>
  );
}
