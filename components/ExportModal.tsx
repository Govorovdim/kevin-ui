import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

import { storage } from "../lib/storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
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

const MIN_YEAR = 2020;
const MAX_YEAR = 2030;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  householdId: number;
  householdName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportModal({
  visible,
  onClose,
  householdId,
  householdName,
}: Props) {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState(0); // January
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [endYear, setEndYear] = useState(currentYear);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Validation ─────────────────────────────────────────────────────────────

  const isStartAfterEnd =
    startYear > endYear || (startYear === endYear && startMonth > endMonth);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function incrementMonth(current: number, setter: (v: number) => void) {
    setter(current >= 11 ? 0 : current + 1);
  }

  function decrementMonth(current: number, setter: (v: number) => void) {
    setter(current <= 0 ? 11 : current - 1);
  }

  function incrementYear(current: number, setter: (v: number) => void) {
    if (current < MAX_YEAR) setter(current + 1);
  }

  function decrementYear(current: number, setter: (v: number) => void) {
    if (current > MIN_YEAR) setter(current - 1);
  }

  // ── Export handler ─────────────────────────────────────────────────────────────

  async function handleExport() {
    if (isStartAfterEnd) return;

    setError(null);

    if (Platform.OS === "web") {
      // Use fetch + Blob to avoid putting the JWT in the URL
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Not authenticated. Please sign in again.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        start_year: String(startYear),
        start_month: String(startMonth + 1),
        end_year: String(endYear),
        end_month: String(endMonth + 1),
      });
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
      const fullUrl = `${baseUrl}/api/v1/households/${householdId}/export?${params}`;

      try {
        const resp = await fetch(fullUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          throw new Error(`Export failed (HTTP ${resp.status})`);
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${householdName.replace(/[^a-zA-Z0-9]/g, "_")}_export.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
      } catch (e: any) {
        setError(e?.message ?? "Export failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Native: async is fine, no browser gesture restrictions
      handleNativeExport();
    }
  }

  async function handleNativeExport() {
    setLoading(true);
    setError(null);

    const token = await storage.getItem("access_token");
    if (!token) {
      setError("Not authenticated. Please sign in again.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      start_year: String(startYear),
      start_month: String(startMonth + 1),
      end_year: String(endYear),
      end_month: String(endMonth + 1),
    });
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
    const fullUrl = `${baseUrl}/api/v1/households/${householdId}/export?${params}`;

    try {
      const FileSystem = await import("expo-file-system/legacy");
      const Sharing = await import("expo-sharing");

      const filename = `${householdName.replace(/[^a-zA-Z0-9]/g, "_")}_export.xlsx`;
      const downloadResult = await FileSystem.downloadAsync(
        fullUrl,
        FileSystem.cacheDirectory + filename,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      await Sharing.shareAsync(downloadResult.uri);
      onClose();
    } catch (e: any) {
      const message =
        e?.response?.data?.detail ??
        e?.message ??
        "Export failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const arrowColor = isDark ? "#9ca3af" : "#6b7280";
  const disabledArrowColor = isDark ? "#4b5563" : "#d1d5db";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/50 px-6"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-5"
          onPress={() => {}}
        >
          {/* Title */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Export Data
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Export household data for &ldquo;{householdName}&rdquo; as an Excel
            spreadsheet.
          </Text>

          {/* From section */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-2">
            From
          </Text>
          <View className="flex-row items-center gap-3 mb-4">
            {/* Month picker */}
            <View className="flex-1 flex-row items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-2.5">
              <TouchableOpacity
                onPress={() => decrementMonth(startMonth, setStartMonth)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
              >
                <Ionicons name="chevron-back" size={18} color={arrowColor} />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center min-w-[72px]">
                {MONTHS[startMonth]}
              </Text>
              <TouchableOpacity
                onPress={() => incrementMonth(startMonth, setStartMonth)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
              >
                <Ionicons name="chevron-forward" size={18} color={arrowColor} />
              </TouchableOpacity>
            </View>

            {/* Year picker */}
            <View className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-2.5 min-w-[100px]">
              <TouchableOpacity
                onPress={() => decrementYear(startYear, setStartYear)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
                disabled={startYear <= MIN_YEAR}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={
                    startYear <= MIN_YEAR ? disabledArrowColor : arrowColor
                  }
                />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center">
                {startYear}
              </Text>
              <TouchableOpacity
                onPress={() => incrementYear(startYear, setStartYear)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
                disabled={startYear >= MAX_YEAR}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    startYear >= MAX_YEAR ? disabledArrowColor : arrowColor
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* To section */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-2">
            To
          </Text>
          <View className="flex-row items-center gap-3 mb-4">
            {/* Month picker */}
            <View className="flex-1 flex-row items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-2.5">
              <TouchableOpacity
                onPress={() => decrementMonth(endMonth, setEndMonth)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
              >
                <Ionicons name="chevron-back" size={18} color={arrowColor} />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center min-w-[72px]">
                {MONTHS[endMonth]}
              </Text>
              <TouchableOpacity
                onPress={() => incrementMonth(endMonth, setEndMonth)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
              >
                <Ionicons name="chevron-forward" size={18} color={arrowColor} />
              </TouchableOpacity>
            </View>

            {/* Year picker */}
            <View className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-2.5 min-w-[100px]">
              <TouchableOpacity
                onPress={() => decrementYear(endYear, setEndYear)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
                disabled={endYear <= MIN_YEAR}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={endYear <= MIN_YEAR ? disabledArrowColor : arrowColor}
                />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 text-center">
                {endYear}
              </Text>
              <TouchableOpacity
                onPress={() => incrementYear(endYear, setEndYear)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
                disabled={endYear >= MAX_YEAR}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={endYear >= MAX_YEAR ? disabledArrowColor : arrowColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Validation error */}
          {isStartAfterEnd && (
            <Text className="text-sm text-red-500 mb-3">
              Start date cannot be after end date.
            </Text>
          )}

          {/* API error */}
          {error && <Text className="text-sm text-red-500 mb-3">{error}</Text>}

          {/* Export button */}
          <TouchableOpacity
            className={`rounded-xl py-3 items-center justify-center mt-1 ${
              isStartAfterEnd || loading
                ? "bg-primary-400 opacity-60"
                : "bg-primary-600"
            }`}
            onPress={handleExport}
            disabled={isStartAfterEnd || loading}
            activeOpacity={0.75}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="download-outline" size={18} color="#ffffff" />
                <Text className="text-white font-semibold text-base">
                  Export
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
