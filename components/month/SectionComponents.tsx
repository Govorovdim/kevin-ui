import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../lib/format";

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </Text>
      <TouchableOpacity
        onPress={onAdd}
        className="w-8 h-8 bg-primary-600 rounded-full items-center justify-center"
      >
        <Text className="text-white text-xl font-bold leading-none">+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── BreakdownBar ─────────────────────────────────────────────────────────────

/** Thin proportional colour bar. Only renders with 2+ non-zero items. */
export function BreakdownBar({
  items,
}: {
  items: { amount: number; color: string }[];
}) {
  const nonZero = items.filter((i) => i.amount > 0);
  if (nonZero.length < 2) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {nonZero.map((item, i) => (
        <View
          key={i}
          style={{ flex: item.amount, backgroundColor: item.color }}
        />
      ))}
    </View>
  );
}

// ─── ActionItemRow ────────────────────────────────────────────────────────────

export function ActionItemRow({
  left,
  right,
  rightColor,
  subtitle,
  isLast,
  accentColor,
  onEdit,
  onDelete,
}: {
  left: string;
  right: string;
  rightColor: string;
  subtitle?: string;
  isLast?: boolean;
  accentColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      className={`flex-row items-center py-2 ${
        isLast ? "" : "border-b border-gray-100 dark:border-gray-700"
      }`}
    >
      {accentColor && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: accentColor,
            marginRight: 8,
            flexShrink: 0,
          }}
        />
      )}
      <View className="flex-1 mr-2">
        <Text className="text-gray-700 dark:text-gray-300">{left}</Text>
        {subtitle ? (
          <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text className={`font-medium ${rightColor} mr-3`}>{right}</Text>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        className="p-1 mr-1"
      >
        <Ionicons name="create-outline" size={18} color="#9ca3af" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        className="p-1"
      >
        <Ionicons name="trash-outline" size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

export function SummaryCard({
  label,
  value,
  valueColor,
  currency = "USD",
}: {
  label: string;
  value: number;
  valueColor: string;
  currency?: string;
}) {
  return (
    <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4">
      <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
        {label}
      </Text>
      <Text className={`text-base font-bold ${valueColor}`}>
        {formatCurrency(value, currency)}
      </Text>
    </View>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
      {children}
    </View>
  );
}

// ─── TotalRow ─────────────────────────────────────────────────────────────────

export function TotalRow({
  label,
  value,
  valueColor,
  currency = "USD",
}: {
  label: string;
  value: number;
  valueColor: string;
  currency?: string;
}) {
  return (
    <View className="flex-row justify-between items-center border-t-2 border-gray-200 dark:border-gray-600 pt-2 mt-1">
      <Text className="text-gray-700 dark:text-gray-300 font-semibold">
        {label}
      </Text>
      <Text className={`font-bold ${valueColor}`}>
        {formatCurrency(value, currency)}
      </Text>
    </View>
  );
}

// ─── EmptyNote ────────────────────────────────────────────────────────────────

export function EmptyNote({ message }: { message: string }) {
  return (
    <Text className="text-gray-400 dark:text-gray-500 text-sm py-1">
      {message}
    </Text>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────

export const PIE_PALETTE = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#0d9488",
  "#9333ea",
  "#ca8a04",
  "#dc2626",
];
