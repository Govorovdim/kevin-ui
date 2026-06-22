import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { TickerSearchInput } from "../ui/TickerSearchInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  required?: boolean;
  /** When set to "ticker-search", renders a TickerSearchInput dropdown. */
  type?: "text" | "ticker-search";
  /** When type is "ticker-search", the key of the field to auto-fill with the fetched price. */
  fillOnSelect?: string;
}

export interface FormModalProps {
  visible: boolean;
  title: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// ─── Field configurations ─────────────────────────────────────────────────────

export const INCOME_FIELDS: FieldConfig[] = [
  { key: "title", label: "Title", placeholder: "Salary", required: true },
  {
    key: "amount",
    label: "Amount",
    placeholder: "0.00",
    keyboardType: "decimal-pad",
    required: true,
  },
];

export const EXPENSE_FIELDS: FieldConfig[] = [
  { key: "title", label: "Title", placeholder: "Rent", required: true },
  {
    key: "amount",
    label: "Amount",
    placeholder: "0.00",
    keyboardType: "decimal-pad",
    required: true,
  },
];

export const LIABILITY_FIELDS: FieldConfig[] = [
  { key: "title", label: "Title", placeholder: "Car loan", required: true },
  {
    key: "amount",
    label: "Amount",
    placeholder: "0.00",
    keyboardType: "decimal-pad",
    required: true,
  },
];

export const ASSET_FIELDS: FieldConfig[] = [
  { key: "title", label: "Title", placeholder: "Apple Stock", required: true },
  {
    key: "ticker",
    label: "Ticker (optional)",
    placeholder: "AAPL",
    type: "ticker-search" as const,
    fillOnSelect: "bought_price",
  },
  {
    key: "amount",
    label: "Quantity (optional)",
    placeholder: "0",
    keyboardType: "decimal-pad",
  },
  {
    key: "bought_price",
    label: "Price (optional)",
    placeholder: "0.00",
    keyboardType: "decimal-pad",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FormModal({
  visible,
  title,
  fields,
  initialValues,
  onSubmit,
  onClose,
  isLoading = false,
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  useEffect(() => {
    if (visible) {
      const init: Record<string, string> = {};
      fields.forEach((f) => {
        init[f.key] = initialValues?.[f.key] ?? "";
      });
      setValues(init);
      setErrors(new Set());
    }
  }, [visible]);

  const handleSave = () => {
    const emptyRequired = fields
      .filter((f) => f.required && (values[f.key] ?? "").trim().length === 0)
      .map((f) => f.key);
    if (emptyRequired.length > 0) {
      setErrors(new Set(emptyRequired));
      return;
    }
    onSubmit(values);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        {/* Backdrop — tap to close */}
        <TouchableOpacity
          className="flex-1"
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Bottom-sheet card */}
        <View
          className="bg-white dark:bg-gray-800 rounded-t-3xl"
          style={{
            maxHeight: "88%",
            maxWidth: 540,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 40,
            }}
          >
            {/* Header row */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-gray-400 dark:text-gray-500 text-xl">
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            {fields.map((field) => (
              <View key={field.key}>
                <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                  {field.label}
                </Text>
                {field.type === "ticker-search" ? (
                  <TickerSearchInput
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(symbol, price) => {
                      setValues((v) => {
                        const next = { ...v, [field.key]: symbol };
                        if (field.fillOnSelect && price != null) {
                          next[field.fillOnSelect] = String(price);
                        }
                        return next;
                      });
                    }}
                  />
                ) : (
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[field.key] = ref;
                    }}
                    className={`border rounded-xl px-4 py-3 mb-3 text-gray-900 dark:text-white dark:bg-gray-700 ${
                      errors.has(field.key)
                        ? "border-red-500"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    placeholder={field.placeholder}
                    placeholderTextColor="#9ca3af"
                    keyboardType={field.keyboardType ?? "default"}
                    value={values[field.key] ?? ""}
                    onChangeText={(text) => {
                      setValues((v) => ({ ...v, [field.key]: text }));
                      if (errors.has(field.key)) {
                        setErrors((e) => {
                          const next = new Set(e);
                          next.delete(field.key);
                          return next;
                        });
                      }
                    }}
                    returnKeyType={
                      fields.indexOf(field) === fields.length - 1
                        ? "done"
                        : "next"
                    }
                    blurOnSubmit={fields.indexOf(field) === fields.length - 1}
                    onSubmitEditing={() => {
                      const idx = fields.indexOf(field);
                      if (idx === fields.length - 1) {
                        handleSave();
                      } else {
                        // Focus next text field
                        const nextField = fields[idx + 1];
                        if (nextField && nextField.type !== "ticker-search") {
                          inputRefs.current[nextField.key]?.focus();
                        }
                      }
                    }}
                  />
                )}
              </View>
            ))}

            {/* Save */}
            <TouchableOpacity
              className="bg-primary-600 rounded-xl py-3 items-center mb-3 mt-2"
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Save</Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={onClose} className="items-center py-2">
              <Text className="text-gray-500 dark:text-gray-400">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
