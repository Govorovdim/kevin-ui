import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

import {
  useHouseholds,
  useCreateHousehold,
  useRenameHousehold,
  useDeleteHousehold,
  useLeaveHousehold,
} from "../lib/hooks/useHouseholds";
import HouseholdInviteModal from "./HouseholdInviteModal";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";
import CurrencyPicker from "./CurrencyPicker";
import { useHouseholdStore } from "../store/household.store";
import { useAuthStore } from "../store/auth.store";
import { storage } from "../lib/storage";
import { api } from "../lib/api";
import { THEME_STORAGE_KEY } from "../app/_layout";
import type { Household } from "../lib/types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  /** Called when user picks a household from the list */
  onSelectHousehold: (household: Household) => void;
  /** Whether to show export/import buttons */
  showExportImport?: boolean;
  /** The currently active household (for export/import context and checkmark) */
  activeHousehold?: Household | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SideMenu({
  visible,
  onClose,
  onSelectHousehold,
  showExportImport = false,
  activeHousehold = null,
}: SideMenuProps) {
  // ── Local state ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameError, setNewNameError] = useState(false);
  const [newCurrency, setNewCurrency] = useState("USD");

  const [editingHousehold, setEditingHousehold] = useState<Household | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState(false);

  const [inviteHousehold, setInviteHousehold] = useState<Household | null>(
    null,
  );
  const [pendingDeleteHousehold, setPendingDeleteHousehold] =
    useState<Household | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // ── Hooks / stores ───────────────────────────────────────────────────────
  const { data: households } = useHouseholds();
  const createHousehold = useCreateHousehold();
  const renameHousehold = useRenameHousehold();
  const deleteHousehold = useDeleteHousehold();
  const leaveHousehold = useLeaveHousehold();
  const { activeHousehold: storeActiveHousehold, setActiveHousehold } =
    useHouseholdStore();
  const { clearToken } = useAuthStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSelectHousehold(h: Household) {
    onSelectHousehold(h);
  }

  function handleCreateHousehold() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewNameError(true);
      return;
    }

    createHousehold.mutate(
      { name: trimmed, currency: newCurrency },
      {
        onSuccess: (created) => {
          setShowForm(false);
          setNewName("");
          setNewNameError(false);
          setNewCurrency("USD");
          onSelectHousehold(created);
        },
      },
    );
  }

  function handleCancelForm() {
    setShowForm(false);
    setNewName("");
    setNewNameError(false);
    setNewCurrency("USD");
  }

  function handleStartEdit(h: Household) {
    setEditingHousehold(h);
    setEditName(h.name);
    setEditNameError(false);
  }

  function handleCancelEdit() {
    setEditingHousehold(null);
    setEditName("");
    setEditNameError(false);
  }

  function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditNameError(true);
      return;
    }
    if (!editingHousehold) return;
    renameHousehold.mutate(
      { id: editingHousehold.id, name: trimmed },
      {
        onSuccess: (updated) => {
          if (storeActiveHousehold?.id === updated.id)
            setActiveHousehold(updated);
          handleCancelEdit();
        },
      },
    );
  }

  async function handleThemeToggle(value: boolean) {
    const scheme = value ? "dark" : "light";
    setColorScheme(scheme);
    await storage.setItem(THEME_STORAGE_KEY, scheme);
  }

  function handleConfirmDeleteOrLeave(h: Household) {
    const list = households ?? [];
    const other = list.find((x) => x.id !== h.id);
    if (h.member_count > 1) {
      leaveHousehold.mutate(h.id, {
        onSuccess: () => {
          if (storeActiveHousehold?.id === h.id && other)
            setActiveHousehold(other);
          setPendingDeleteHousehold(null);
          onClose();
        },
      });
    } else {
      deleteHousehold.mutate(h.id, {
        onSuccess: () => {
          if (storeActiveHousehold?.id === h.id && other)
            setActiveHousehold(other);
          setPendingDeleteHousehold(null);
          onClose();
        },
      });
    }
  }

  async function handleSignOut() {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // Ignore errors — we're logging out regardless
    }
    await storage.deleteItem("access_token");
    await storage.deleteItem("refresh_token");
    clearToken();
    onClose();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Full-screen row: backdrop | panel */}
        <View className="flex-1 flex-row">
          {/* ── Left: semi-transparent backdrop ───────────────────────────── */}
          <Pressable className="flex-1 bg-black/50" onPress={onClose} />

          {/* ── Right: slide-in panel ─────────────────────────────────────── */}
          <View className="w-72 bg-white dark:bg-gray-900 h-full">
            <SafeAreaView className="flex-1">
              {/* Header ──────────────────────────────────────────────────── */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  Menu
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-xl text-gray-400 dark:text-gray-500">
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Divider ─────────────────────────────────────────────────── */}
              <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

              {/* Dark mode row ───────────────────────────────────────────── */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-base text-gray-800 dark:text-gray-200">
                  Dark Mode
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: "#d1d5db", true: "#2563eb" }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Divider ─────────────────────────────────────────────────── */}
              <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

              {/* Households section ──────────────────────────────────────── */}
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
              >
                <View className="px-4 mt-4 pb-2">
                  {/* Section label */}
                  <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-1">
                    Households
                  </Text>

                  {/* Household rows */}
                  {(households ?? []).map((h) =>
                    pendingDeleteHousehold?.id === h.id ? (
                      // ── Inline delete/leave confirmation ────────────────
                      <View key={h.id} className="py-2">
                        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {h.member_count > 1
                            ? `Leave "${h.name}"?`
                            : `Delete "${h.name}"?`}
                        </Text>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            className="flex-1 bg-danger-500 rounded-lg py-2 items-center justify-center"
                            onPress={() => handleConfirmDeleteOrLeave(h)}
                            disabled={
                              deleteHousehold.isPending ||
                              leaveHousehold.isPending
                            }
                            activeOpacity={0.75}
                          >
                            {deleteHousehold.isPending ||
                            leaveHousehold.isPending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text className="text-white font-semibold text-sm">
                                {h.member_count > 1 ? "Leave" : "Delete"}
                              </Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 items-center justify-center"
                            onPress={() => setPendingDeleteHousehold(null)}
                            disabled={
                              deleteHousehold.isPending ||
                              leaveHousehold.isPending
                            }
                            activeOpacity={0.75}
                          >
                            <Text className="text-gray-600 dark:text-gray-400 text-sm">
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : editingHousehold?.id === h.id ? (
                      // ── Inline rename form ──────────────────────────────
                      <View key={h.id} className="py-2">
                        <TextInput
                          className={`border rounded-lg px-3 py-2 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 ${
                            editNameError
                              ? "border-red-500"
                              : "border-primary-400"
                          }`}
                          value={editName}
                          onChangeText={(t) => {
                            setEditName(t);
                            if (editNameError) setEditNameError(false);
                          }}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={handleSaveEdit}
                          editable={!renameHousehold.isPending}
                        />
                        <View className="flex-row mt-2 gap-2">
                          <TouchableOpacity
                            className="flex-1 bg-primary-600 rounded-lg py-2 items-center justify-center"
                            onPress={handleSaveEdit}
                            disabled={renameHousehold.isPending}
                            activeOpacity={0.75}
                          >
                            {renameHousehold.isPending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text className="text-white font-semibold text-sm">
                                Save
                              </Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 items-center justify-center"
                            onPress={handleCancelEdit}
                            disabled={renameHousehold.isPending}
                            activeOpacity={0.75}
                          >
                            <Text className="text-gray-600 dark:text-gray-400 text-sm">
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      // ── Normal row ─────────────────────────────────────
                      <TouchableOpacity
                        key={h.id}
                        className="flex-row items-center justify-between py-2.5"
                        onPress={() => handleSelectHousehold(h)}
                        activeOpacity={0.6}
                      >
                        <Text
                          className="text-base text-gray-800 dark:text-gray-200 flex-1 mr-2"
                          numberOfLines={1}
                        >
                          {h.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          {/* Rename button */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleStartEdit(h);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.6}
                          >
                            <Text className="text-gray-400 dark:text-gray-500 text-sm">
                              ✎
                            </Text>
                          </TouchableOpacity>
                          {/* Invite QR button */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setInviteHousehold(h);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.6}
                          >
                            <Text className="text-gray-400 dark:text-gray-500 text-base">
                              ⊞
                            </Text>
                          </TouchableOpacity>
                          {/* Delete / leave button — only shown when user has >1 household */}
                          {(households ?? []).length > 1 && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                setPendingDeleteHousehold(h);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.6}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={14}
                                color="#ef4444"
                              />
                            </TouchableOpacity>
                          )}
                          {activeHousehold?.id === h.id && (
                            <Text className="text-primary-600 font-bold text-base">
                              ✓
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ),
                  )}

                  {/* New Household ─ toggle button or inline form */}
                  {showForm ? (
                    <View className="mt-2 mb-1">
                      <TextInput
                        className={`border rounded-lg px-3 py-2 text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 ${
                          newNameError
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Household name"
                        placeholderTextColor="#9ca3af"
                        value={newName}
                        onChangeText={(t) => {
                          setNewName(t);
                          if (newNameError) setNewNameError(false);
                        }}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleCreateHousehold}
                        editable={!createHousehold.isPending}
                      />
                      <CurrencyPicker
                        value={newCurrency}
                        onChange={setNewCurrency}
                      />
                      <View className="flex-row mt-2 gap-2">
                        <TouchableOpacity
                          className="flex-1 bg-primary-600 rounded-lg py-2 items-center justify-center"
                          onPress={handleCreateHousehold}
                          disabled={createHousehold.isPending}
                          activeOpacity={0.75}
                        >
                          {createHousehold.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-white font-semibold text-sm">
                              Create
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 items-center justify-center"
                          onPress={handleCancelForm}
                          disabled={createHousehold.isPending}
                          activeOpacity={0.75}
                        >
                          <Text className="text-gray-600 dark:text-gray-400 text-sm">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="py-2.5"
                      onPress={() => setShowForm(true)}
                      activeOpacity={0.6}
                    >
                      <Text className="text-primary-600 font-medium text-base">
                        + New Household
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              {/* Divider ─────────────────────────────────────────────────── */}
              <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

              {/* Export / Import section ─────────────────────────────────── */}
              {showExportImport && activeHousehold && (
                <>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 gap-2"
                    onPress={() => setShowExportModal(true)}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={isDark ? "#9ca3af" : "#4b5563"}
                    />
                    <Text className="text-base text-gray-800 dark:text-gray-200">
                      Export Data
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3 gap-2"
                    onPress={() => setShowImportModal(true)}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="push-outline"
                      size={18}
                      color={isDark ? "#9ca3af" : "#4b5563"}
                    />
                    <Text className="text-base text-gray-800 dark:text-gray-200">
                      Import Data
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Spacer — pushes Sign Out to the bottom ─────────────────── */}
              <View className="flex-1" />

              {/* Divider ─────────────────────────────────────────────────── */}
              <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

              {/* Sign Out ────────────────────────────────────────────────── */}
              <TouchableOpacity
                className="px-4 py-4"
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <Text className="text-danger-500 font-semibold text-base">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {inviteHousehold && (
        <HouseholdInviteModal
          visible={!!inviteHousehold}
          onClose={() => setInviteHousehold(null)}
          householdId={inviteHousehold.id}
          householdName={inviteHousehold.name}
        />
      )}

      {showExportImport && activeHousehold && showExportModal && (
        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          householdId={activeHousehold.id}
          householdName={activeHousehold.name}
        />
      )}

      {showExportImport && activeHousehold && showImportModal && (
        <ImportModal
          visible={showImportModal}
          onClose={() => setShowImportModal(false)}
          householdId={activeHousehold.id}
          householdName={activeHousehold.name}
        />
      )}
    </>
  );
}
