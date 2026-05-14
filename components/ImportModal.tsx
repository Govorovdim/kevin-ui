import { useState, useRef } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  householdId: number;
  householdName: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportResult {
  income: number;
  expenses: number;
  assets: number;
  liabilities: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportModal({
  visible,
  onClose,
  householdId,
  householdName,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    data: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  // ── Reset state on close ───────────────────────────────────────────────────

  function handleClose() {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    setLoading(false);
    onClose();
  }

  // ── File picking ───────────────────────────────────────────────────────────

  async function handlePickFile() {
    setError(null);

    if (Platform.OS === "web") {
      fileInputRef.current?.click();
    } else {
      // @ts-ignore – resolved at runtime on native
      const DocumentPicker = await import("expo-document-picker");
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (!pickerResult.canceled && pickerResult.assets?.[0]) {
        const asset = pickerResult.assets[0];
        setSelectedFile({
          name: asset.name,
          data: {
            uri: asset.uri,
            name: asset.name,
            type:
              asset.mimeType ??
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        });
      }
    }
  }

  function handleWebFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile({ name: file.name, data: file });
    }
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile.data);

    try {
      const res = await api.post(
        `/api/v1/households/${householdId}/import`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(res.data.imported);
      // Invalidate all overview queries so the UI refreshes
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    } catch (e: any) {
      const message =
        e?.response?.data?.detail ??
        e?.message ??
        "Import failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-center items-center bg-black/50 px-6"
        onPress={handleClose}
      >
        <Pressable
          className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-5"
          onPress={() => {}}
        >
          {/* Title */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Import Data
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>

          {result ? (
            /* ── Success state ─────────────────────────────────────────── */
            <View>
              <View className="items-center mb-4">
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                <Text className="text-base font-semibold text-gray-900 dark:text-white mt-2">
                  Import Successful
                </Text>
              </View>

              <View className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                {result.income > 0 && (
                  <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Income: {result.income} rows
                  </Text>
                )}
                {result.expenses > 0 && (
                  <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Expenses: {result.expenses} rows
                  </Text>
                )}
                {result.assets > 0 && (
                  <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Assets: {result.assets} rows
                  </Text>
                )}
                {result.liabilities > 0 && (
                  <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Liabilities: {result.liabilities} rows
                  </Text>
                )}
                {result.income +
                  result.expenses +
                  result.assets +
                  result.liabilities ===
                  0 && (
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    No data rows found in the file.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="bg-primary-600 rounded-xl py-3 items-center justify-center"
                onPress={handleClose}
                activeOpacity={0.75}
              >
                <Text className="text-white font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── File pick + upload state ──────────────────────────────── */
            <View>
              {/* Subtitle */}
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Import data into &ldquo;{householdName}&rdquo; from an Excel
                spreadsheet (.xlsx).
              </Text>

              {/* Hidden web file input */}
              {Platform.OS === "web" && (
                <input
                  ref={fileInputRef as any}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={handleWebFileChange}
                />
              )}

              {/* File picker area */}
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-6 items-center justify-center mb-4"
                onPress={handlePickFile}
                activeOpacity={0.6}
              >
                {selectedFile ? (
                  <View className="items-center">
                    <Ionicons
                      name="document-text"
                      size={28}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                    <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2 text-center px-4">
                      {selectedFile.name}
                    </Text>
                    <Text className="text-xs text-primary-600 mt-1">
                      Tap to change
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={32}
                      color={isDark ? "#9ca3af" : "#9ca3af"}
                    />
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Choose an Excel file
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Error */}
              {error && (
                <Text className="text-sm text-red-500 mb-3">{error}</Text>
              )}

              {/* Import button */}
              <TouchableOpacity
                className={`rounded-xl py-3 items-center justify-center ${
                  !selectedFile || loading
                    ? "bg-primary-400 opacity-60"
                    : "bg-primary-600"
                }`}
                onPress={handleImport}
                disabled={!selectedFile || loading}
                activeOpacity={0.75}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="push-outline" size={18} color="#ffffff" />
                    <Text className="text-white font-semibold text-base">
                      Import
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
