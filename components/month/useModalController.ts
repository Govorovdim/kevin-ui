import { useState } from "react";
import type { Income, Expense, Asset, Liability } from "../../lib/types";
import type { FieldConfig } from "./FormModal";
import {
  INCOME_FIELDS,
  EXPENSE_FIELDS,
  ASSET_FIELDS,
  LIABILITY_FIELDS,
} from "./FormModal";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalMode =
  | { type: "income"; mode: "add" }
  | { type: "income"; mode: "edit"; item: Income }
  | { type: "expense"; mode: "add" }
  | { type: "expense"; mode: "edit"; item: Expense }
  | { type: "asset"; mode: "add" }
  | { type: "asset"; mode: "edit"; item: Asset }
  | { type: "liability"; mode: "add" }
  | { type: "liability"; mode: "edit"; item: Liability }
  | null;

interface CrudHooks {
  createIncome: { mutate: Function; isPending: boolean };
  updateIncome: { mutate: Function; isPending: boolean };
  createExpense: { mutate: Function; isPending: boolean };
  updateExpense: { mutate: Function; isPending: boolean };
  createAsset: { mutate: Function; isPending: boolean };
  updateAsset: { mutate: Function; isPending: boolean };
  createLiability: { mutate: Function; isPending: boolean };
  updateLiability: { mutate: Function; isPending: boolean };
}

interface ModalConfig {
  title: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string>;
  isLoading: boolean;
  onSubmit: (values: Record<string, string>) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModalController(crud: CrudHooks) {
  const [modalState, setModalState] = useState<ModalMode>(null);
  const closeModal = () => setModalState(null);

  function getModalConfig(): ModalConfig | null {
    if (!modalState) return null;

    switch (modalState.type) {
      case "income": {
        const ms = modalState;
        return {
          title: ms.mode === "add" ? "Add Income" : "Edit Income",
          fields: INCOME_FIELDS,
          isLoading:
            ms.mode === "add"
              ? crud.createIncome.isPending
              : crud.updateIncome.isPending,
          initialValues:
            ms.mode === "edit"
              ? { title: ms.item.title, amount: String(ms.item.amount) }
              : undefined,
          onSubmit: (values) => {
            const body = {
              title: values.title,
              amount: parseFloat(values.amount || "0"),
            };
            if (ms.mode === "add") {
              crud.createIncome.mutate(body, { onSuccess: closeModal });
            } else {
              crud.updateIncome.mutate(
                { id: ms.item.id, ...body },
                { onSuccess: closeModal },
              );
            }
          },
        };
      }

      case "expense": {
        const ms = modalState;
        return {
          title: ms.mode === "add" ? "Add Expense" : "Edit Expense",
          fields: EXPENSE_FIELDS,
          isLoading:
            ms.mode === "add"
              ? crud.createExpense.isPending
              : crud.updateExpense.isPending,
          initialValues:
            ms.mode === "edit"
              ? { title: ms.item.title, amount: String(ms.item.amount) }
              : undefined,
          onSubmit: (values) => {
            const body = {
              title: values.title,
              amount: parseFloat(values.amount || "0"),
            };
            if (ms.mode === "add") {
              crud.createExpense.mutate(body, { onSuccess: closeModal });
            } else {
              crud.updateExpense.mutate(
                { id: ms.item.id, ...body },
                { onSuccess: closeModal },
              );
            }
          },
        };
      }

      case "asset": {
        const ms = modalState;
        return {
          title: ms.mode === "add" ? "Add Asset" : "Edit Asset",
          fields: ASSET_FIELDS,
          isLoading:
            ms.mode === "add"
              ? crud.createAsset.isPending
              : crud.updateAsset.isPending,
          initialValues:
            ms.mode === "edit"
              ? {
                  title: ms.item.title,
                  ticker: ms.item.ticker ?? "",
                  amount:
                    ms.item.amount != null ? String(ms.item.amount) : "",
                  bought_price:
                    ms.item.bought_price != null
                      ? String(ms.item.bought_price)
                      : "",
                }
              : undefined,
          onSubmit: (values) => {
            const body = {
              title: values.title,
              ticker: values.ticker || null,
              amount: values.amount ? parseFloat(values.amount) : null,
              bought_price: values.bought_price
                ? parseFloat(values.bought_price)
                : null,
              current_price: null as number | null,
            };
            if (ms.mode === "add") {
              crud.createAsset.mutate(body, { onSuccess: closeModal });
            } else {
              crud.updateAsset.mutate(
                { id: ms.item.id, ...body },
                { onSuccess: closeModal },
              );
            }
          },
        };
      }

      case "liability": {
        const ms = modalState;
        return {
          title: ms.mode === "add" ? "Add Liability" : "Edit Liability",
          fields: LIABILITY_FIELDS,
          isLoading:
            ms.mode === "add"
              ? crud.createLiability.isPending
              : crud.updateLiability.isPending,
          initialValues:
            ms.mode === "edit"
              ? { title: ms.item.title, amount: String(ms.item.amount) }
              : undefined,
          onSubmit: (values) => {
            const body = {
              title: values.title,
              amount: parseFloat(values.amount || "0"),
            };
            if (ms.mode === "add") {
              crud.createLiability.mutate(body, { onSuccess: closeModal });
            } else {
              crud.updateLiability.mutate(
                { id: ms.item.id, ...body },
                { onSuccess: closeModal },
              );
            }
          },
        };
      }
    }
  }

  return {
    modalState,
    setModalState,
    closeModal,
    getModalConfig,
  };
}
