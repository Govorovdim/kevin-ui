import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useMonthOverview } from "../../../lib/hooks/useOverview";
import { useHouseholdStore } from "../../../store/household.store";
import {
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useCreateLiability,
  useUpdateLiability,
  useDeleteLiability,
} from "../../../lib/hooks/useCrud";
import {
  FormModal,
  SummaryCard,
  SimpleSection,
  AssetSection,
  useModalController,
} from "../../../components/month";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MonthDetailScreen() {
  const router = useRouter();
  const { year: yearStr, month: monthStr } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const { activeHousehold } = useHouseholdStore();
  const hid = activeHousehold?.id ?? 0;
  const currency = activeHousehold?.currency ?? "USD";

  // ── CRUD hooks ─────────────────────────────────────────────────────────────
  const createIncome = useCreateIncome(hid, year, month);
  const updateIncome = useUpdateIncome(hid, year, month);
  const deleteIncome = useDeleteIncome(hid, year, month);

  const createExpense = useCreateExpense(hid, year, month);
  const updateExpense = useUpdateExpense(hid, year, month);
  const deleteExpense = useDeleteExpense(hid, year, month);

  const createAsset = useCreateAsset(hid, year, month);
  const updateAsset = useUpdateAsset(hid, year, month);
  const deleteAsset = useDeleteAsset(hid, year, month);

  const createLiability = useCreateLiability(hid, year, month);
  const updateLiability = useUpdateLiability(hid, year, month);
  const deleteLiability = useDeleteLiability(hid, year, month);

  // ── Modal controller ───────────────────────────────────────────────────────
  const { modalState, setModalState, closeModal, getModalConfig } =
    useModalController({
      createIncome,
      updateIncome,
      createExpense,
      updateExpense,
      createAsset,
      updateAsset,
      createLiability,
      updateLiability,
    });

  const modalConfig = getModalConfig();

  // ── Overview data ──────────────────────────────────────────────────────────
  const { data, isLoading } = useMonthOverview(
    activeHousehold?.id ?? null,
    year,
    month,
  );

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const income = data?.income ?? [];
  const expenses = data?.expenses ?? [];
  const assets = data?.assets ?? [];
  const liabilities = data?.liabilities ?? [];

  // ── Confirm-delete helper ──────────────────────────────────────────────────
  const confirmDelete = (onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this?")) {
        onConfirm();
      }
      return;
    }
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}
        className="flex-row items-center px-4 py-3"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-8"
        >
          <Ionicons name="chevron-back" size={28} color="#2563eb" />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-xl font-bold text-gray-900 dark:text-white">
          {monthLabel}
        </Text>

        {/* Balancing spacer keeps the title truly centered */}
        <View className="w-8" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 720, width: "100%" }} className="px-4 pt-2">
          {/* ── Summary 2 × 2 grid ─────────────────────────────────────── */}
          <View className="flex-row gap-3 mb-3">
            <SummaryCard
              label="Income"
              value={data?.total_income ?? 0}
              valueColor="text-success-600"
              currency={currency}
            />
            <SummaryCard
              label="Expenses"
              value={data?.total_expenses ?? 0}
              valueColor="text-warning-600"
              currency={currency}
            />
          </View>
          <View className="flex-row gap-3 mb-6">
            <SummaryCard
              label="Portfolio"
              value={data?.portfolio_value ?? 0}
              valueColor="text-primary-600"
              currency={currency}
            />
            <SummaryCard
              label="Liabilities"
              value={data?.total_debt ?? 0}
              valueColor="text-danger-600"
              currency={currency}
            />
          </View>

          {/* ── Net Worth row (Large) ─────────────────────────────────── */}
          <View className="bg-primary-600 rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-primary-100 text-xs font-medium mb-1">
              Net Worth
            </Text>
            <Text className="text-white text-3xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 0,
              }).format(data?.net_worth ?? 0)}
            </Text>
          </View>

          {/* ── Income ─────────────────────────────────────────────────── */}
          <SimpleSection
            title="Income"
            items={income}
            totalLabel="Total"
            totalValue={data?.total_income ?? 0}
            totalColor="text-success-600"
            itemColor="text-success-600"
            currency={currency}
            emptyMessage="No income recorded"
            showBreakdown
            onAdd={() => setModalState({ type: "income", mode: "add" })}
            onEdit={(item) =>
              setModalState({ type: "income", mode: "edit", item })
            }
            onDelete={(id) => confirmDelete(() => deleteIncome.mutate(id))}
          />

          {/* ── Expenses ───────────────────────────────────────────────── */}
          <SimpleSection
            title="Expenses"
            items={expenses}
            totalLabel="Total"
            totalValue={data?.total_expenses ?? 0}
            totalColor="text-warning-600"
            itemColor="text-warning-600"
            currency={currency}
            emptyMessage="No expenses recorded"
            showBreakdown
            onAdd={() => setModalState({ type: "expense", mode: "add" })}
            onEdit={(item) =>
              setModalState({ type: "expense", mode: "edit", item })
            }
            onDelete={(id) => confirmDelete(() => deleteExpense.mutate(id))}
          />

          {/* ── Assets ─────────────────────────────────────────────────── */}
          <AssetSection
            title="Assets"
            items={assets}
            totalLabel="Portfolio"
            totalValue={data?.portfolio_value ?? 0}
            totalColor="text-primary-600"
            itemColor="text-primary-600"
            currency={currency}
            emptyMessage="No assets recorded"
            onAdd={() => setModalState({ type: "asset", mode: "add" })}
            onEdit={(item) =>
              setModalState({ type: "asset", mode: "edit", item })
            }
            onDelete={(id) => confirmDelete(() => deleteAsset.mutate(id))}
          />

          {/* ── Liabilities ────────────────────────────────────────────── */}
          <SimpleSection
            title="Liabilities"
            items={liabilities}
            totalLabel="Total liabilities"
            totalValue={data?.total_debt ?? 0}
            totalColor="text-danger-600"
            itemColor="text-danger-600"
            currency={currency}
            emptyMessage="No liabilities recorded"
            onAdd={() => setModalState({ type: "liability", mode: "add" })}
            onEdit={(item) =>
              setModalState({ type: "liability", mode: "edit", item })
            }
            onDelete={(id) => confirmDelete(() => deleteLiability.mutate(id))}
          />
        </View>
      </ScrollView>

      {/* ── Single shared FormModal ────────────────────────────────────── */}
      <FormModal
        visible={modalState !== null}
        title={modalConfig?.title ?? ""}
        fields={modalConfig?.fields ?? []}
        initialValues={modalConfig?.initialValues}
        onSubmit={modalConfig?.onSubmit ?? (() => {})}
        onClose={closeModal}
        isLoading={modalConfig?.isLoading}
      />
    </SafeAreaView>
  );
}
