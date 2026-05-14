import React from "react";
import { formatCurrency } from "../../lib/format";
import type { Income, Expense, Asset, Liability } from "../../lib/types";
import {
  SectionHeader,
  SectionCard,
  BreakdownBar,
  ActionItemRow,
  TotalRow,
  EmptyNote,
  PIE_PALETTE,
} from "./SectionComponents";

// ─── Types ────────────────────────────────────────────────────────────────────

type FinancialItem = Income | Expense | Asset | Liability;

interface BaseSectionProps {
  title: string;
  totalLabel: string;
  totalValue: number;
  totalColor: string;
  itemColor: string;
  currency: string;
  emptyMessage: string;
  onAdd: () => void;
}

// ─── Simple section (Income / Expense / Liability) ────────────────────────────

interface SimpleSectionProps extends BaseSectionProps {
  items: (Income | Expense | Liability)[];
  showBreakdown?: boolean;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
}

export function SimpleSection({
  title,
  items,
  totalLabel,
  totalValue,
  totalColor,
  itemColor,
  currency,
  emptyMessage,
  showBreakdown = false,
  onAdd,
  onEdit,
  onDelete,
}: SimpleSectionProps) {
  return (
    <SectionCard>
      <SectionHeader title={title} onAdd={onAdd} />
      {showBreakdown && (
        <BreakdownBar
          items={items.map((item, i) => ({
            amount: item.amount,
            color: PIE_PALETTE[i % PIE_PALETTE.length],
          }))}
        />
      )}
      {items.length === 0 ? (
        <EmptyNote message={emptyMessage} />
      ) : (
        items.map((item, index) => (
          <ActionItemRow
            key={item.id}
            left={item.title}
            right={formatCurrency(item.amount, currency)}
            rightColor={itemColor}
            isLast={index === items.length - 1}
            accentColor={
              showBreakdown
                ? PIE_PALETTE[index % PIE_PALETTE.length]
                : undefined
            }
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))
      )}
      <TotalRow
        label={totalLabel}
        value={totalValue}
        valueColor={totalColor}
        currency={currency}
      />
    </SectionCard>
  );
}

// ─── Asset section ────────────────────────────────────────────────────────────

interface AssetSectionProps extends BaseSectionProps {
  items: Asset[];
  onEdit: (item: Asset) => void;
  onDelete: (id: number) => void;
}

export function AssetSection({
  title,
  items,
  totalLabel,
  totalValue,
  totalColor,
  itemColor,
  currency,
  emptyMessage,
  onAdd,
  onEdit,
  onDelete,
}: AssetSectionProps) {
  return (
    <SectionCard>
      <SectionHeader title={title} onAdd={onAdd} />
      {items.length === 0 ? (
        <EmptyNote message={emptyMessage} />
      ) : (
        items.map((item, index) => {
          const value =
            (item.amount ?? 1) *
            (item.current_price ?? item.bought_price ?? 0);
          return (
            <ActionItemRow
              key={item.id}
              left={item.title}
              subtitle={item.ticker ?? undefined}
              right={formatCurrency(value, currency)}
              rightColor={itemColor}
              isLast={index === items.length - 1}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          );
        })
      )}
      <TotalRow
        label={totalLabel}
        value={totalValue}
        valueColor={totalColor}
        currency={currency}
      />
    </SectionCard>
  );
}
